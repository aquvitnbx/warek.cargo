'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createConsolidation(formData: FormData, selectedPackageIds: string[]) {
  const customerId = formData.get('customer_id') as string;
  const serviceTypeCode = formData.get('service_type_code') as string || 'REGULER';

  if (!customerId) return { success: false, message: 'ID Customer tidak ditemukan.' };
  if (!selectedPackageIds || selectedPackageIds.length === 0) {
     return { success: false, message: 'Tidak ada paket yang dipilih.' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 0. HARD VALIDATION: Doctrine Whitelist Eligibility + Double Assignment Prevention
    const pkgCheckQuery = await client.query(`
       SELECT id, tracking_number, package_status_code 
       FROM inbound_packages p
       WHERE id = ANY($1) 
         AND (
           package_status_code NOT IN ('RECEIVED_AT_HUB', 'REPACKING')
           OR EXISTS (SELECT 1 FROM shipment_packages sp WHERE sp.inbound_package_id = p.id)
         )
    `, [selectedPackageIds]);
    
    if (pkgCheckQuery.rows.length > 0) {
       throw new Error(`Terdapat ${pkgCheckQuery.rows.length} resi yang tertolak. Penyebab: 1) Status fisik belum diterima di Hub, ATAU 2) Paket sudah terlanjur dimasukkan ke dalam Karung lain (Race Condition).`);
    }

    // 1. Generate unique shipment_code
    // Format: SHP-YYYYMMDD-RandomHex
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randHex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
    const shipmentCode = `SHP-${dateStr}-${randHex}`;

    // 2. Insert into customer_shipments
    // Using OPTION B: batch_id is NULL for now. 
    // Statuses based on doctrine/master tables.
    const shipmentQuery = `
      INSERT INTO customer_shipments (
        customer_id, 
        shipment_code, 
        service_type_code, 
        payment_status_code, 
        shipment_status_code, 
        pickup_delivery_status_code
      ) VALUES ($1, $2, $3, 'PENDING', 'AWAITING_PACKAGES', 'NOT_READY')
      RETURNING id
    `;
    const resShipment = await client.query(shipmentQuery, [customerId, shipmentCode, serviceTypeCode]);
    const shipmentId = resShipment.rows[0].id;

    // 3. Insert into shipment_packages & update package status
    // Prepare the bulk values
    for (const pkgId of selectedPackageIds) {
       // Insert ke tabel relasi
       await client.query(
         `INSERT INTO shipment_packages (shipment_id, inbound_package_id) VALUES ($1, $2)`, 
         [shipmentId, pkgId]
       );

       // Opsional tapi disarankan oleh Doctrine: Rekam history status paket bila diubah
       // Karena ini sekarang masuk "Consolidation", kita bisa mengubah state-nya
       // Namun standard `ref_package_statuses` saat ini: RECEIVED_AT_HUB, DAMAGED, UNIDENTIFIED
       // Untuk patuh pada Doctrine secara kaku, kita tidak mengubah isi string hardcode liar
       // Biarkan status tetap RECEIVED_AT_HUB tapi karena sudah ditautkan ke shipment, kita taruh history bahwa ia digabung
       await client.query(
         `INSERT INTO inbound_package_status_history (inbound_package_id, to_status_code, changed_source, change_notes) 
          VALUES ($1, 'RECEIVED_AT_HUB', 'CONSOLIDATION_MODULE', 'Tergabung ke shipment karung raksasa: ' || $2)`,
         [pkgId, shipmentCode]
       );
    }

    await client.query('COMMIT');

    revalidatePath('/consolidation');
    revalidatePath(`/consolidation/customer/${customerId}`);
    
    return { success: true, message: `Shipment ${shipmentCode} berhasil dibuat!` };

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Consolidation Error:', err);
    return { success: false, message: err.message || 'Gagal menyimpan transaksi.' };
  } finally {
    client.release();
  }
}

export async function cancelInboundPackage(formData: FormData) {
  const packageId = formData.get('package_id') as string;
  const reasonCategory = formData.get('reason_category') as string;
  const reasonText = formData.get('reason_text') as string;

  if (!packageId || !reasonCategory) {
    return { success: false, message: 'ID Paket atau Kategori Alasan Batal tidak valid.' };
  }

  const fullReason = `[${reasonCategory}] ${reasonText}`;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Cek Paket, pastikan dia belum masuk shipment_packages
    const resPrev = await client.query(`
      SELECT p.package_status_code, p.tracking_number, 
             EXISTS(SELECT 1 FROM shipment_packages sp WHERE sp.inbound_package_id = p.id) as is_assigned
      FROM inbound_packages p 
      WHERE p.id = $1 FOR UPDATE
    `, [packageId]);

    if (resPrev.rows.length === 0) throw new Error("Paket tidak ditemukan.");
    
    const { package_status_code: fromStatus, tracking_number: trackingNumber, is_assigned } = resPrev.rows[0];

    if (is_assigned) {
      throw new Error("Penolakan Mutlak: Paket ini telanjur terjahit di dalam Karung. Silakan Bongkar Karung tersebut terlebih dahulu sebelum membatal resi ini.");
    }
    if (fromStatus === 'CANCELLED') {
      throw new Error("Paket memang sudah berstatus Batal (CANCELLED).");
    }

    // 2. Tandai Batal
    await client.query(`
      UPDATE inbound_packages 
      SET package_status_code = 'CANCELLED', updated_at = NOW() 
      WHERE id = $1
    `, [packageId]);

    // 3. Status History
    await client.query(`
      INSERT INTO inbound_package_status_history (inbound_package_id, from_status_code, to_status_code, changed_source, change_notes) 
      VALUES ($1, $2, 'CANCELLED', 'CONSOLIDATION_MODULE', $3)
    `, [packageId, fromStatus, 'BATAL KIRIM: ' + fullReason]);

    // 4. Audit Log
    const jsonChanges = JSON.stringify({ package_status_code: { old: fromStatus, new: "CANCELLED" }, reason: fullReason });
    await client.query(`
      INSERT INTO system_audit_logs (
        entity_name, entity_id, action_type, changes_json,
        source_module, source_action, revision_note, revised_by
      ) VALUES (
        $1, $2, $3, $4, 
        $5, $6, $7, $8
      )
    `, [
      'INBOUND_PACKAGE', packageId, 'CANCEL_PACKAGE_TICKET', jsonChanges,
      'CONSOLIDATION_MODULE', 'cancelInboundPackage', fullReason, 'Admin Sesi'
    ]);

    await client.query('COMMIT');
    revalidatePath('/consolidation');
    return { success: true, message: `Resi ${trackingNumber} berhasil dilabeli BATAL dan dikeluarkan dari antrean.` };

  } catch (err: any) {
    await client.query('ROLLBACK');
    return { success: false, message: err.message || 'Server error saat membatal tiket.' };
  } finally {
    client.release();
  }
}
