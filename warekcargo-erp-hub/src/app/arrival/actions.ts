'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { processShipmentNotification } from '@/lib/notifications';

export async function processBatchArrival(formData: FormData) {
  const batchId = formData.get('batch_id') as string;

  if (!batchId) {
    return { success: false, message: 'Data ID Kapal (Batch) tidak ditemukan.' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Cek Batch valid & get status
    const batchRes = await client.query('SELECT batch_status_code FROM shipping_batches WHERE id = $1 FOR UPDATE', [batchId]);
    if (batchRes.rows.length === 0) {
       throw new Error("Jadwal Kapal/Batch tidak ditemukan.");
    }
    if (batchRes.rows[0].batch_status_code === 'ARRIVED' || batchRes.rows[0].batch_status_code === 'COMPLETED') {
       throw new Error("Kapal ini sudah dibongkar/selesai sebelumnya.");
    }

    // 2. Tandai Batch Kapal jadi ARRIVED
    await client.query(`
      UPDATE shipping_batches
      SET batch_status_code = 'ARRIVED', updated_at = NOW()
      WHERE id = $1
    `, [batchId]);

    // 3. Tarik ID semua Shipment berstatus DISPATCHED yang bernaung dalam kapal ini
    const shipmentRes = await client.query(`
      SELECT id, shipment_status_code FROM customer_shipments 
      WHERE batch_id = $1 AND shipment_status_code = 'DISPATCHED'
    `, [batchId]);

    const shipmentIds = shipmentRes.rows.map((row: any) => row.id);

    // 4. Ubah serentak status Karung Induk ke ARRIVED_DESTINATION
    if (shipmentIds.length > 0) {
      await client.query(`
        UPDATE customer_shipments
        SET shipment_status_code = 'ARRIVED_DESTINATION', updated_at = NOW()
        WHERE id = ANY($1::uuid[])
      `, [shipmentIds]);
      
      // 5. Rekam riwayat pergeseran
      // Karena kita mau massal, kita bangun query parameters array
      let historyQuery = 'INSERT INTO shipment_status_history (shipment_id, from_status_code, to_status_code, changed_source, change_notes) VALUES ';
      const histVals: any[] = [];
      let valIndex = 1;
      
      for (const row of shipmentRes.rows) {
         historyQuery += `($${valIndex++}, $${valIndex++}, $${valIndex++}, $${valIndex++}, $${valIndex++}),`;
         histVals.push(row.id, row.shipment_status_code, 'ARRIVED_DESTINATION', 'ARRIVAL_MODULE', 'Tiba di fasilitas destinasi (Bongkar Muat Massal)');
      }
      
      // Remove trailing comma
      historyQuery = historyQuery.slice(0, -1);
      await client.query(historyQuery, histVals);

      // 6. Trigger Notifications for ARRIVED_DESTINATION
      for (const shipmentId of shipmentIds) {
         await processShipmentNotification(shipmentId, 'ARRIVED_DESTINATION', client);
      }
    }

    await client.query('COMMIT');
    
    // Revalidasi jalur UI
    revalidatePath('/arrival');
    revalidatePath(`/arrival/${batchId}`);
    revalidatePath('/delivery');
    revalidatePath('/tracking');

    return { success: true, message: `Berhasil membongkar ${shipmentIds.length} karung dari kapal ke fasilitas Destinasi.` };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Batch Arrival Error:', error);
    return { success: false, message: error.message || 'Gagal mengeksekusi pembongkaran manifest kapal.' };
  } finally {
    client.release();
  }
}
