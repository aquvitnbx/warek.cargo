'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function setFinalCharge(formData: FormData) {
  const shipmentId = formData.get('shipment_id') as string;
  const chargeAmount = parseFloat(formData.get('final_charge_amount') as string);
  const revisionNote = formData.get('revision_note') as string || 'Penetapan Harga Awal Bebas Override';

  if (!shipmentId) return { success: false, message: 'ID Karung tidak ditemukan.' };
  if (isNaN(chargeAmount) || chargeAmount < 1000) return { success: false, message: 'Nilai tagihan tidak masuk akal.' };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Cek Status (Hard Lock Cek)
    const resShp = await client.query('SELECT final_charge_amount, payment_status_code FROM customer_shipments WHERE id = $1 FOR UPDATE', [shipmentId]);
    if (resShp.rows.length === 0) throw new Error('Resi Karung tidak ditemukan di sistem.');

    const oldCharge = resShp.rows[0].final_charge_amount;
    const isPaid = resShp.rows[0].payment_status_code === 'PAID';

    // 🔴 HARD LOCK MUTLAK: Tagihan yang Lunas tak boleh dimanipulasi manual ke bawah
    if (isPaid && oldCharge !== null) {
       throw new Error('Sistem terkunci (HARD LOCK). Tagihan yang berstatus LUNAS (PAID) mutlak tidak dapat diedit nilai charge-nya.');
    }

    if (oldCharge !== null && revisionNote.length < 5) {
       throw new Error('Soft-Edit Ditolak: Anda memodifikasi tagihan lama namun keterangan "Alasan Koreksi" terlalu pendek/kosong.');
    }

    // 1. Eksekusi Perubahan Utama
    await client.query(`
      UPDATE customer_shipments 
      SET final_charge_amount = $1, payment_status_code = 'PENDING', updated_at = NOW()
      WHERE id = $2
    `, [chargeAmount, shipmentId]);

    // 2. Tembak peluru Histori (The JSONB Logger)
    const jsonChanges = JSON.stringify({
        "final_charge_amount": {
            "old": oldCharge ? Number(oldCharge) : null,
            "new": chargeAmount
        }
    });

    await client.query(`
      INSERT INTO system_audit_logs (
        entity_name, entity_id, action_type, changes_json,
        source_module, source_action, revision_note, revised_by, related_shipment_id
      ) VALUES (
        $1, $2, $3, $4, 
        $5, $6, $7, $8, $9
      )
    `, [
       'CUSTOMER_SHIPMENT', shipmentId, 'OVERRIDE_FINAL_CHARGE', jsonChanges,
       'FINANCE_CASHIER', 'setFinalCharge', revisionNote, 'Admin Kasir Sesi', shipmentId
    ]);

    await client.query('COMMIT');

    revalidatePath('/finance');
    revalidatePath(`/finance/${shipmentId}`);
    
    return { success: true };

  } catch (err: any) {
    await client.query('ROLLBACK');
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
