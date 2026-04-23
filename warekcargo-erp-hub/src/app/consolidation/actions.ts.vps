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
          VALUES ($1, 'RECEIVED_AT_HUB', 'CONSOLIDATION_MODULE', 'Tergabung ke shipment: ' || $2)`,
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
