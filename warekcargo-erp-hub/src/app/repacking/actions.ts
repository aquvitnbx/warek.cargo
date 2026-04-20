'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitRepack(formData: FormData) {
  const shipmentId = formData.get('shipment_id') as string;
  const totalWeightKg = parseFloat(formData.get('total_weight_kg') as string);
  const totalVolumeM3 = parseFloat(formData.get('total_volume_m3') as string);
  const notes = formData.get('notes') as string || null;

  if (!shipmentId) return { success: false, message: 'ID Shipment tidak ditemukan.' };
  if (isNaN(totalWeightKg) || totalWeightKg <= 0) return { success: false, message: 'Berat (Kg) tidak valid.' };
  if (isNaN(totalVolumeM3) || totalVolumeM3 < 0) return { success: false, message: 'Dimensi M³ tidak valid.' };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Dapatkan status sebelumnya
    const resPrev = await client.query('SELECT shipment_status_code FROM customer_shipments WHERE id = $1', [shipmentId]);
    if (resPrev.rows.length === 0) throw new Error("Shipment tidak ditemukan di database.");
    const fromStatus = resPrev.rows[0].shipment_status_code;

    // 2. Update Shipments table
    // Rubah status ke READY_FOR_DISPATCH karena fisik sudah komplit dan ditimbang
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

    // 3. Catat ke History jika belum READY_FOR_DISPATCH
    if (fromStatus !== 'READY_FOR_DISPATCH') {
       await client.query(`
         INSERT INTO shipment_status_history (shipment_id, from_status_code, to_status_code, changed_source, change_notes)
         VALUES ($1, $2, 'READY_FOR_DISPATCH', 'REPACKING_MODULE', 'Finalisasi timbang dan volume karung')
       `, [shipmentId, fromStatus]);
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
