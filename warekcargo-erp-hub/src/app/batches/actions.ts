'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createBatch(formData: FormData) {
  const hubId = formData.get('hub_id') as string;
  const transportModeCode = formData.get('transport_mode_code') as string;
  const vesselName = formData.get('vessel_name') as string || null;
  const voyageNumber = formData.get('voyage_number') as string || null;
  const closingAtStr = formData.get('closing_at') as string;
  const etdAtStr = formData.get('etd_at') as string;
  const originPortCode = formData.get('origin_port_code') as string || null;
  const serviceTypeCode = formData.get('service_type_code') as string;

  if (!hubId || !transportModeCode || !closingAtStr || !etdAtStr || !serviceTypeCode) {
     return { success: false, message: 'Harap lengkapi field wajib.' };
  }

  // Generate unique Batch Code (Contoh: B-JKT-260401-1234)
  const dateStr = new Date(etdAtStr).toISOString().slice(2, 10).replace(/-/g, '');
  const randNum = Math.floor(Math.random() * 9000 + 1000);
  const batchCode = `B-${dateStr}-${randNum}`;

  const closingAt = new Date(closingAtStr);
  const etdAt = new Date(etdAtStr);

  if (closingAt > etdAt) {
     return { success: false, message: 'Waktu closing tidak boleh lebih lambat dari waktu keberangkatan (ETD).' };
  }

  try {
     const query = `
       INSERT INTO shipping_batches (
          batch_code, hub_id, origin_port_code, destination_city,
          service_type_code, transport_mode_code, vessel_name, voyage_number,
          batch_status_code, closing_at, etd_at
       ) VALUES ($1, $2, $3, 'Nabire', $4, $5, $6, $7, 'PLANNED', $8, $9)
       RETURNING id
     `;
     const values = [batchCode, hubId, originPortCode, serviceTypeCode, transportModeCode, vesselName, voyageNumber, closingAt.toISOString(), etdAt.toISOString()];
     
     const res = await pool.query(query, values);
     
     revalidatePath('/batches');
     return { success: true, id: res.rows[0].id };
  } catch (err: any) {
     console.error('Batch Creation Error:', err);
     return { success: false, message: err.message || 'Gagal menyimpan batch baru.' };
  }
}

export async function assignShipmentsToBatch(formData: FormData, selectedShipmentIds: string[]) {
  const batchId = formData.get('batch_id') as string;
  
  if (!batchId) return { success: false, message: 'ID Batch tidak valid' };
  if (!selectedShipmentIds || selectedShipmentIds.length === 0) return { success: false, message: 'Tidak ada karung yang dipilih' };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    for (const shipmentId of selectedShipmentIds) {
       // Cek status lama
       const resPrev = await client.query('SELECT shipment_status_code, shipment_code FROM customer_shipments WHERE id = $1', [shipmentId]);
       const fromStatus = resPrev.rows[0].shipment_status_code;
       
       // Update shipment assign ke batch
       await client.query(`
         UPDATE customer_shipments
         SET batch_id = $1, shipment_status_code = 'DISPATCHED', updated_at = NOW()
         WHERE id = $2
       `, [batchId, shipmentId]);

       // Log History
       await client.query(`
         INSERT INTO shipment_status_history (shipment_id, from_status_code, to_status_code, changed_source, change_notes)
         VALUES ($1, $2, 'DISPATCHED', 'BATCH_MODULE', 'Masuk ke jadwal kapal')
       `, [shipmentId, fromStatus]);
    }

    await client.query('COMMIT');

    revalidatePath('/batches');
    revalidatePath(`/batches/${batchId}`);
    
    return { success: true, message: `${selectedShipmentIds.length} karung berhasil dimasukkan ke manifest Kapal!` };

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Batch Assignment Error:', err);
    return { success: false, message: err.message || 'Gagal asign karung.' };
  } finally {
    client.release();
  }
}
