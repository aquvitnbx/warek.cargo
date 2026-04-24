'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createCustomer(formData: FormData) {
  const full_name = formData.get('full_name')?.toString() || '';
  let whatsapp_number = formData.get('whatsapp_number')?.toString() || '';
  const destination_city = formData.get('destination_city')?.toString() || 'Nabire';
  const address = formData.get('address')?.toString() || '';
  const notes = formData.get('notes')?.toString() || '';

  // Simple sanity check for WA: remove non-digits
  whatsapp_number = whatsapp_number.replace(/\D/g, '');
  if (!whatsapp_number.startsWith('62')) {
    whatsapp_number = '62' + whatsapp_number.replace(/^0+/, '');
  }

  try {
     const res = await pool.query(`
        INSERT INTO customers (full_name, whatsapp_number, destination_city, address, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
     `, [full_name, whatsapp_number, destination_city, address, notes]);
     
  } catch (err: any) {
    if (err.code === '23505') {
       return { success: false, message: 'Nomor WhatsApp sudah terdaftar.' };
    }
    return { success: false, message: err.message || 'Gagal menyimpan customer.' };
  }

  revalidatePath('/customers');
  redirect('/customers');
}

export async function updateCustomer(formData: FormData) {
  const customerId = formData.get('id')?.toString();
  const full_name = formData.get('full_name')?.toString() || '';
  let whatsapp_number = formData.get('whatsapp_number')?.toString() || '';
  const destination_city = formData.get('destination_city')?.toString() || 'Nabire';
  const address = formData.get('address')?.toString() || '';
  const notes = formData.get('notes')?.toString() || '';
  
  if (!customerId) return { success: false, message: 'ID Customer tidak ditemukan.' };

  whatsapp_number = whatsapp_number.replace(/\D/g, '');
  if (!whatsapp_number.startsWith('62')) {
    whatsapp_number = '62' + whatsapp_number.replace(/^0+/, '');
  }

  try {
     await pool.query(`
        UPDATE customers 
        SET full_name = $1, whatsapp_number = $2, destination_city = $3, address = $4, notes = $5, updated_at = NOW()
        WHERE id = $6
     `, [full_name, whatsapp_number, destination_city, address, notes, customerId]);
     
  } catch (err: any) {
    if (err.code === '23505') return { success: false, message: 'Nomor WhatsApp sudah digunakan oleh orang lain.' };
    return { success: false, message: err.message || 'Gagal mengubah profil customer.' };
  }

  revalidatePath('/customers');
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

export async function deleteCustomer(formData: FormData) {
  const customerId = formData.get('id')?.toString();
  if (!customerId) return { success: false, message: 'ID Customer tidak ditemukan.' };

  try {
     // Soft delete
     await pool.query(`UPDATE customers SET is_active = false, updated_at = NOW() WHERE id = $1`, [customerId]);
     revalidatePath('/customers');
     revalidatePath(`/customers/${customerId}`);
     return { success: true };
  } catch (err: any) {
     return { success: false, message: err.message || 'Gagal menghapus pelanggan (Soft Delete).' };
  }
}
