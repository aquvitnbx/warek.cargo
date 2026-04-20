'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitBatch(formData: FormData) {
  const batchNumber = formData.get('batch_number') as string;
  const transportMode = formData.get('transport_mode') as string;
  const closingAtStr = formData.get('closing_at') as string;
  
  if (!batchNumber) return;
  
  const closingAt = closingAtStr ? new Date(closingAtStr) : null;
  // Defaulting to REGULAR service type for Phase 1 as dictated by blueprints
  const serviceTypeCode = 'REGULAR'; 

  try {
    const insertQuery = `
      INSERT INTO shipping_batches (batch_number, service_type_code, transport_mode, closing_at, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'planned', NOW(), NOW())
    `;
    
    await pool.query(insertQuery, [batchNumber, serviceTypeCode, transportMode, closingAt]);
    
    revalidatePath('/batches');
    revalidatePath('/');
  } catch (error) {
    console.error('Batch insert error:', error);
  }
}
