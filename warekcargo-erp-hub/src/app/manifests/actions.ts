'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

function generateBatchCode(hubCode: string) {
  const d = new Date();
  const yymmdd = [d.getFullYear().toString().slice(-2), ('0' + (d.getMonth() + 1)).slice(-2), ('0' + d.getDate()).slice(-2)].join('');
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `VOY-${hubCode}-${yymmdd}-${rnd}`;
}

export async function createBatchManifest(formData: FormData) {
  const hub_id = formData.get('hub_id') as string;
  const hub_code = formData.get('hub_code') as string || 'HUB';
  const transport_mode_code = formData.get('transport_mode_code') as string;
  const service_type_code = formData.get('service_type_code') as string;
  const designated_vessel_name = formData.get('vessel_name') as string;
  const voyage_number = formData.get('voyage_number') as string;
  const etd_at = formData.get('etd_at') as string;
  const closing_at = formData.get('closing_at') as string;
  const notes = formData.get('notes') as string;

  if (!hub_id || !transport_mode_code || !service_type_code || !designated_vessel_name || !etd_at) {
     return { success: false, message: 'Harap lengkapi Modus Angkutan, Jenis Layanan, Armada/Vessel, dan Jadwal ETD.' };
  }

  const batchCode = generateBatchCode(hub_code);
  const client = await pool.connect();

  try {
     const res = await client.query(`
        INSERT INTO shipping_batches (
           batch_code, hub_id, service_type_code, transport_mode_code, 
           vessel_name, voyage_number, batch_status_code,
           closing_at, etd_at, notes
        ) VALUES (
           $1, $2, $3, $4, 
           $5, $6, 'OPEN', 
           $7, $8, $9
        ) RETURNING id
     `, [
        batchCode, hub_id, service_type_code, transport_mode_code,
        designated_vessel_name, voyage_number,
        closing_at || etd_at, etd_at, notes
     ]);
     
     revalidatePath('/manifests');
     return { success: true, batch_id: res.rows[0].id };
  } catch (err: any) {
     console.error('Batch Create Error:', err);
     return { success: false, message: err.message || 'Gagal menyimpan armada.' };
  } finally {
     client.release();
  }
}

export async function updateBatchStatus(batchId: string, newStatus: string, reason: string = '') {
  if (!batchId || !newStatus) return { success: false, message: 'Data tidak valid' };

  const client = await pool.connect();
  try {
     await client.query('BEGIN');

     await client.query(
        `UPDATE shipping_batches SET batch_status_code = $1, notes = COALESCE(notes, '') || ' | Status berubah ke ' || $1::text || ' by Admin: ' || $2::text WHERE id = $3`,
        [newStatus, reason, batchId]
     );

     // Jika kapal DEPARTED, maka Karung/Shipments terkait juga wajib "DISPATCHED" (Sudah sungguhan berangkat)
     if (newStatus === 'DEPARTED') {
        const shipmentsRes = await client.query('SELECT id, shipment_code FROM customer_shipments WHERE batch_id = $1', [batchId]);
        for (const s of shipmentsRes.rows) {
           await client.query(`UPDATE customer_shipments SET shipment_status_code = 'DISPATCHED' WHERE id = $1`, [s.id]);
           await client.query(`
              INSERT INTO shipment_status_history (shipment_id, to_status_code, changed_source, change_notes)
              VALUES ($1, 'DISPATCHED', 'MANIFEST_MODULE', 'Kapal/Transport diberangkatkan (ETD terpenuhi)')
           `, [s.id]);
        }
     }
     
     // 🔴 REVERSAL: Jika jadwal kapal dibatalkan mutlak, bongkar wujud Karung dari kontainer/kapal!
     if (newStatus === 'CANCELLED') {
        const shipmentsRes = await client.query('SELECT id, shipment_code FROM customer_shipments WHERE batch_id = $1', [batchId]);
        for (const s of shipmentsRes.rows) {
           await client.query(`
              UPDATE customer_shipments 
              SET shipment_status_code = 'READY_FOR_DISPATCH', 
                  batch_id = NULL, 
                  batch_container_id = NULL 
              WHERE id = $1
           `, [s.id]);
           await client.query(`
              INSERT INTO shipment_status_history (shipment_id, from_status_code, to_status_code, changed_source, change_notes)
              VALUES ($1, 'MANIFESTED', 'READY_FOR_DISPATCH', 'MANIFEST_MODULE', 'Armada dibatalkan. Resi diturunkan kembali menunggu alokasi transport baru.')
           `, [s.id]);
        }
     }

     await client.query('COMMIT');
     revalidatePath('/manifests');
     return { success: true };
  } catch (err: any) {
     await client.query('ROLLBACK');
     return { success: false, message: err.message };
  } finally {
     client.release();
  }
}

export async function createBatchContainer(batchId: string, formData: FormData) {
  const container_number = formData.get('container_number') as string;
  const container_type = formData.get('container_type') as string;
  const destination_city = formData.get('destination_city') as string || 'Nabire';

  if (!batchId || !container_number) return { success: false, message: 'Data tidak valid' };

  const client = await pool.connect();
  try {
     await client.query(`
        INSERT INTO batch_containers (batch_id, container_number, container_type, destination_city) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (batch_id, container_number) DO NOTHING
     `, [batchId, container_number.toUpperCase(), container_type, destination_city]);
     
     revalidatePath('/manifests/[id]', 'page');
     return { success: true };
  } catch (err: any) {
     return { success: false, message: err.message };
  } finally {
     client.release();
  }
}

export async function assignShipmentToManifest(shipmentId: string, batchId: string, containerId: string) {
  if (!shipmentId || !batchId || !containerId) return { success: false, message: 'Data tidak valid' };

  const client = await pool.connect();
  try {
     await client.query('BEGIN');
     
     const sRes = await client.query('SELECT shipment_status_code FROM customer_shipments WHERE id = $1', [shipmentId]);
     const currentStatus = sRes.rows[0]?.shipment_status_code;

     await client.query(`
        UPDATE customer_shipments 
        SET batch_id = $1, batch_container_id = $2, shipment_status_code = 'MANIFESTED'
        WHERE id = $3
     `, [batchId, containerId, shipmentId]);

     if (currentStatus !== 'MANIFESTED') {
        await client.query(`
           INSERT INTO shipment_status_history (shipment_id, to_status_code, changed_source, change_notes)
           VALUES ($1, 'MANIFESTED', 'MANIFEST_MODULE', 'Karung dimanifestkan ke kontainer armada via 3-Tier Route')
        `, [shipmentId]);
     }

     await client.query('COMMIT');
     revalidatePath('/repacking/[id]', 'page');
     revalidatePath('/manifests/[id]', 'page');
     
     return { success: true };
  } catch (err: any) {
     await client.query('ROLLBACK');
     return { success: false, message: err.message };
  } finally {
     client.release();
  }
}

export async function removeShipmentFromContainer(formData: FormData) {
  const shipmentId = formData.get('shipment_id') as string;
  const containerId = formData.get('container_id') as string; 
  const batchId = formData.get('batch_id') as string;

  if (!shipmentId) return { success: false, message: 'ID Karung tidak valid.' };

  const client = await pool.connect();
  try {
     await client.query('BEGIN');
     
     // Validasi apakah jadwal sudah jalan
     const sRes = await client.query(`
       SELECT c.shipment_status_code, b.batch_status_code 
       FROM customer_shipments c 
       LEFT JOIN shipping_batches b ON c.batch_id = b.id 
       WHERE c.id = $1
     `, [shipmentId]);
     
     if (sRes.rows.length === 0) throw new Error('Karung tidak ditemukan.');
     const { batch_status_code } = sRes.rows[0];

     if (batch_status_code === 'DEPARTED') {
        throw new Error('Tidak dapat mencabut karung. Kapal sudah berangkat (DEPARTED).');
     }

     const updateQuery = `
        UPDATE customer_shipments 
        SET batch_id = NULL, 
            batch_container_id = NULL, 
            shipment_status_code = 'READY_FOR_DISPATCH',
            updated_at = NOW()
        WHERE id = $1
     `;
     await client.query(updateQuery, [shipmentId]);

     await client.query(`
        INSERT INTO shipment_status_history (shipment_id, from_status_code, to_status_code, changed_source, change_notes)
        VALUES ($1, 'MANIFESTED', 'READY_FOR_DISPATCH', 'MANIFEST_MODULE', 'Karung di-detach/dikeluarkan manual secara spesifik dari kontainer.')
     `, [shipmentId]);

     await client.query('COMMIT');
     
     if (batchId && containerId) {
       revalidatePath(`/manifests/${batchId}/container/${containerId}`);
     }
     
     return { success: true };
  } catch (err: any) {
     await client.query('ROLLBACK');
     console.error('Detach Error:', err);
     return { success: false, message: err.message || 'Gagal melepas karung.' };
  } finally {
     client.release();
  }
}
