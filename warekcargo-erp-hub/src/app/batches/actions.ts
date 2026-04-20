'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitBatch(formData: FormData) {
  const batchCode = formData.get('batch_number') as string;
  const transportModeCode = formData.get('transport_mode') as string;
  const closingAtStr = formData.get('closing_at') as string;
  
  if (!batchCode) return;
  
  const closingAt = closingAtStr ? new Date(closingAtStr) : new Date();

  try {
    // Sebagai permulaan, asumsikan pembuatan jadwal batch terikat ke Hub Jakarta
    const hubRes = await pool.query(`SELECT id FROM hubs WHERE code = 'JKT' LIMIT 1`);
    if (hubRes.rows.length === 0) throw new Error('Hub Induk JKT tidak ditemukan');
    const hubId = hubRes.rows[0].id;

    const insertQuery = `
      INSERT INTO shipping_batches (batch_code, service_type_code, transport_mode_code, closing_at, etd_at, batch_status_code, hub_id, created_at, updated_at)
      VALUES ($1, 'REGULAR', $2, $3, $3, 'PLANNED', $4, NOW(), NOW())
    `;
    
    await pool.query(insertQuery, [batchCode, transportModeCode, closingAt, hubId]);
    
    revalidatePath('/batches');
    revalidatePath('/');
  } catch (error) {
    console.error('Batch insert error:', error);
  }
}
