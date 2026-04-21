'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function setFinalCharge(formData: FormData) {
  const shipmentId = formData.get('shipment_id') as string;
  const chargeAmount = parseFloat(formData.get('final_charge_amount') as string);

  if (!shipmentId) return { success: false, message: 'ID Karung tidak ditemukan.' };
  if (isNaN(chargeAmount) || chargeAmount < 1000) return { success: false, message: 'Nilai tagihan tidak masuk akal.' };

  const client = await pool.connect();

  try {
    // Kunci tagihan. Status akan jadi PENDING karena amount_paid = 0
    await client.query(`
      UPDATE customer_shipments 
      SET final_charge_amount = $1, payment_status_code = 'PENDING', updated_at = NOW()
      WHERE id = $2
    `, [chargeAmount, shipmentId]);

    revalidatePath('/finance');
    revalidatePath(`/finance/${shipmentId}`);
    
    return { success: true };

  } catch (err: any) {
    console.error('Set Charge Error:', err);
    return { success: false, message: err.message || 'Gagal menyimpan tagihan.' };
  } finally {
    client.release();
  }
}

export async function addPayment(formData: FormData) {
  const shipmentId = formData.get('shipment_id') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const paymentMethodCode = formData.get('payment_method_code') as string;
  const paidTo = formData.get('paid_to') as string || null;
  const paymentReference = formData.get('payment_reference') as string || null;

  if (!shipmentId) return { success: false, message: 'ID Karung tidak ditemukan.' };
  if (isNaN(amount) || amount <= 0) return { success: false, message: 'Nilai pembayaran tidak valid.' };
  if (!paymentMethodCode) return { success: false, message: 'Metode pembayaran wajib dipilih.' };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Simpan Transaksi ke shipment_payments
    await client.query(`
      INSERT INTO shipment_payments (shipment_id, payment_method_code, amount, payment_reference, paid_to)
      VALUES ($1, $2, $3, $4, $5)
    `, [shipmentId, paymentMethodCode, amount, paymentReference, paidTo]);

    // 2. Load total tagihan dan total bayar yg lama dari customer_shipments
    const resShp = await client.query('SELECT final_charge_amount, amount_paid FROM customer_shipments WHERE id = $1', [shipmentId]);
    if (resShp.rows.length === 0) throw new Error("Karung tidak ditemukan");
    
    const finalCharge = parseFloat(resShp.rows[0].final_charge_amount || 0);
    const oldPaid = parseFloat(resShp.rows[0].amount_paid || 0);
    const newPaid = oldPaid + amount;

    // 3. Tentukan status baru
    let newStatus = 'PENDING';
    if (newPaid >= finalCharge && finalCharge > 0) {
       newStatus = 'PAID';
    } else if (newPaid > 0) {
       newStatus = 'PARTIAL';
    }

    // 4. Update parent record customer_shipments
    const updateQuery = `
      UPDATE customer_shipments 
      SET 
        amount_paid = $1,
        payment_status_code = $2,
        paid_at = CASE WHEN $2 = 'PAID' AND paid_at IS NULL THEN NOW() ELSE paid_at END,
        updated_at = NOW()
      WHERE id = $3
    `;
    await client.query(updateQuery, [newPaid, newStatus, shipmentId]);

    await client.query('COMMIT');

    revalidatePath('/finance');
    revalidatePath(`/finance/${shipmentId}`);
    
    return { success: true };

  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Add Payment Error:', err);
    return { success: false, message: err.message || 'Gagal menyimpan transaksi pembayaran.' };
  } finally {
    client.release();
  }
}
