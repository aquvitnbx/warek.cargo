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
    const lockedStatuses = ['DISPATCHED', 'ARRIVED_DESTINATION', 'READY_FOR_PICKUP', 'DELIVERED'];
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
          "total_volume_m3": { "old": oldVolume, "new": totalVolumeM3 },
          "notes": { "old": resPrev.rows[0].notes, "new": notes }
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
