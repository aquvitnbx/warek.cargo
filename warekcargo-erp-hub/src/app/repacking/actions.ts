'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitRepack(formData: FormData) {
  const shipmentId = formData.get('shipment_id') as string;
  const totalWeightKg = parseFloat(formData.get('total_weight_kg') as string);
  const totalVolumeM3 = parseFloat(formData.get('total_volume_m3') as string);
  const notes = formData.get('notes') as string || null;
  const revisionNote = formData.get('revision_note') as string || '';

  if (!shipmentId) return { success: false, message: 'ID Shipment tidak ditemukan.' };
  if (isNaN(totalWeightKg) || totalWeightKg <= 0) return { success: false, message: 'Berat (Kg) tidak valid.' };
  if (isNaN(totalVolumeM3) || totalVolumeM3 < 0) return { success: false, message: 'Dimensi M³ tidak valid.' };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Cek Status (Hard Lock Cek)
    const resPrev = await client.query('SELECT shipment_status_code, total_weight_kg, total_volume_m3 FROM customer_shipments WHERE id = $1 FOR UPDATE', [shipmentId]);
    if (resPrev.rows.length === 0) throw new Error("Shipment tidak ditemukan di database.");
    const fromStatus = resPrev.rows[0].shipment_status_code;
    const oldWeight = resPrev.rows[0].total_weight_kg;
    const oldVolume = resPrev.rows[0].total_volume_m3;

    // 🔴 HARD LOCK MUTLAK: Tidak boleh diedit fisik dimensinya jika kapal sudah berangkat (DISPATCHED) atau lebih jauh (ARRIVED dll)
    const lockedStatuses = ['DISPATCHED', 'ARRIVED_DESTINATION', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED'];
    if (lockedStatuses.includes(fromStatus) && oldWeight !== null) {
       throw new Error(`Sistem terkunci (HARD LOCK). Karung berstatus [${fromStatus}] tidak boleh dikoreksi dimensi fisiknya.`);
    }

    // 🟡 SOFT LOCK: Jika sudah READY_FOR_DISPATCH (Sudah pernah disimpan), wajib isi Alasan Koreksi
    if (fromStatus === 'READY_FOR_DISPATCH' && revisionNote.length < 5) {
       throw new Error('Soft-Edit Ditolak: Anda memodifikasi dimensi barang yang sudah disegel. Wajib mengisi "Alasan Koreksi" dengan jelas.');
    }

    // 2. Update Shipments table
    const updateQuery = `
      UPDATE customer_shipments 
      SET 
        total_weight_kg = $1,
        total_volume_m3 = $2,
        notes = $3,
        shipment_status_code = 'READY_FOR_DISPATCH',
        updated_at = NOW()
      WHERE id = $4
    `;
    await client.query(updateQuery, [totalWeightKg, totalVolumeM3, notes, shipmentId]);

    // 3. Catat ke History
    if (fromStatus !== 'READY_FOR_DISPATCH') {
       await client.query(`
         INSERT INTO shipment_status_history (shipment_id, from_status_code, to_status_code, changed_source, change_notes)
         VALUES ($1, $2, 'READY_FOR_DISPATCH', 'REPACKING_MODULE', 'Finalisasi timbang dan volume karung')
       `, [shipmentId, fromStatus]);
    } else {
       // Ini adalah Koreksi Dimensi (Edit) - Merekam jejak ke Audit Log
       const jsonChanges = JSON.stringify({
          "total_weight_kg": { "old": oldWeight, "new": totalWeightKg },
          "total_volume_m3": { "old": oldVolume, "new": totalVolumeM3 }
       });

       await client.query(`
         INSERT INTO system_audit_logs (
           entity_name, entity_id, action_type, changes_json,
           source_module, source_action, revision_note, revised_by, related_shipment_id
         ) VALUES (
           $1, $2, $3, $4, 
           $5, $6, $7, $8, $9
         )
       `, [
          'CUSTOMER_SHIPMENT', shipmentId, 'KOREKSI_DIMENSI_FISIK', jsonChanges,
          'REPACKING_MODULE', 'submitRepack', revisionNote, 'Admin Logistik Sesi', shipmentId
       ]);
    }

    await client.query('COMMIT');

    revalidatePath('/repacking');
    revalidatePath(`/repacking/${shipmentId}`);
    
    return { success: true, message: `Finalisasi Repack Berhasil!` };

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Repacking Error:', err);
    return { success: false, message: err.message || 'Gagal merekam validasi fisik.' };
  } finally {
    client.release();
  }
}

export async function cancelConsolidation(shipmentId: string, reason: string) {
  if (!shipmentId || !reason) return { success: false, message: 'Data tidak valid atau alasan kosong.' };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Cek Status Mutlak (HANYA Boleh AWAITING_PACKAGES atau DRAFT)
    const resPrev = await client.query('SELECT shipment_code, shipment_status_code FROM customer_shipments WHERE id = $1 FOR UPDATE', [shipmentId]);
    if (resPrev.rows.length === 0) throw new Error("Shipment tidak ditemukan di database.");
    
    const { shipment_status_code: fromStatus, shipment_code: shipmentCode } = resPrev.rows[0];

    if (!['AWAITING_PACKAGES', 'DRAFT'].includes(fromStatus)) {
       throw new Error(`Bongkar Karung Ditolak: Karung berstatus [${fromStatus}] sudah masuk logistik dan tidak boleh dibongkar ulang.`);
    }

    // 2. Set Karung Menjadi CANCELLED
    await client.query(`
      UPDATE customer_shipments 
      SET shipment_status_code = 'CANCELLED', notes = CONCAT(notes, ' | BONGKAR KARUNG: ', $2::text), updated_at = NOW()
      WHERE id = $1
    `, [shipmentId, reason]);

    // 3. Rekam History Shipment
    await client.query(`
      INSERT INTO shipment_status_history (shipment_id, from_status_code, to_status_code, changed_source, change_notes)
      VALUES ($1, $2, 'CANCELLED', 'REPACKING_MODULE', 'Karung dibongkar dan digagalkan by Admin')
    `, [shipmentId, fromStatus]);

    // 4. Detach Packages dan Kembalikan ke Hub
    const pkgRes = await client.query(`SELECT inbound_package_id FROM shipment_packages WHERE shipment_id = $1`, [shipmentId]);
    const pkgIds = pkgRes.rows.map(r => r.inbound_package_id);

    if (pkgIds.length > 0) {
       // Putus relasi (Detach)
       await client.query(`DELETE FROM shipment_packages WHERE shipment_id = $1`, [shipmentId]);
       
       // Tulis riwayat bahwa paket-paket ini terpental balik ke HUB murni
       for (const pid of pkgIds) {
          // Walau statusnya di DB tidak pernah berubah dari RECEIVED_AT_HUB, kita rekam historis agar QC tahu paket ini pernah gagal berangkat
          await client.query(`
             INSERT INTO inbound_package_status_history (inbound_package_id, from_status_code, to_status_code, changed_source, change_notes) 
             VALUES ($1, 'RECEIVED_AT_HUB', 'RECEIVED_AT_HUB', 'REPACKING_MODULE', 'Paket dilepas dari Karung ' || $2::text || ' karena pembongkaran.')
          `, [pid, shipmentCode]);
       }
    }

    // 5. Audit Log Inti
    await client.query(`
      INSERT INTO system_audit_logs (
        entity_name, entity_id, action_type, changes_json,
        source_module, source_action, revision_note, revised_by, related_shipment_id
      ) VALUES (
        $1, $2, $3, $4, 
        $5, $6, $7, $8, $9
      )
    `, [
       'CUSTOMER_SHIPMENT', shipmentId, 'BONGKAR_KARUNG_KONSOLIDASI', JSON.stringify({ detached_packages_count: pkgIds.length, reason }),
       'REPACKING_MODULE', 'cancelConsolidation', reason, 'Admin Logistik Sesi', shipmentId
    ]);

    await client.query('COMMIT');

    revalidatePath('/repacking');
    revalidatePath(`/repacking/${shipmentId}`);
    
    return { success: true, message: `Berhasil merusak dan membongkar karung ${shipmentCode}.` };

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Bongkar Error:', err);
    return { success: false, message: err.message || 'Gagal membatalkan spesifikasi karung.' };
  } finally {
    client.release();
  }
}

