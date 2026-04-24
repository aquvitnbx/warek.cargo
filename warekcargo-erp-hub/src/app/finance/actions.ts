'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

type CanonicalPaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUND_PENDING' | 'VOIDED' | 'CANCELLED';

function resolvePaymentStatus(amountPaid: number, finalChargeAmount: number): CanonicalPaymentStatus {
  if (finalChargeAmount > 0 && amountPaid > finalChargeAmount) return 'REFUND_PENDING';
  if (finalChargeAmount > 0 && amountPaid === finalChargeAmount) return 'PAID';
  if (amountPaid > 0) return 'PARTIAL';
  return 'PENDING';
}

export async function setFinalCharge(formData: FormData) {
  const shipmentId = formData.get('shipment_id') as string;
  const chargeAmount = parseFloat(formData.get('final_charge_amount') as string);
  const revisionNote = formData.get('revision_note') as string || 'Penetapan Harga Awal Bebas Override';

  if (!shipmentId) return { success: false, message: 'ID Karung tidak ditemukan.' };
  if (isNaN(chargeAmount) || chargeAmount < 1000) return { success: false, message: 'Nilai tagihan tidak masuk akal.' };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resShp = await client.query('SELECT final_charge_amount, payment_status_code, amount_paid FROM customer_shipments WHERE id = $1 FOR UPDATE', [shipmentId]);
    if (resShp.rows.length === 0) throw new Error('Resi Karung tidak ditemukan di sistem.');

    const oldCharge = resShp.rows[0].final_charge_amount;
    const amountPaid = Number(resShp.rows[0].amount_paid || 0);

    if (oldCharge !== null && revisionNote.length < 5) {
      throw new Error('Soft-Edit Ditolak: Anda memodifikasi tagihan lama namun keterangan "Alasan Koreksi" terlalu pendek/kosong.');
    }

    const newStatus = resolvePaymentStatus(amountPaid, chargeAmount);

    await client.query(`
      UPDATE customer_shipments 
      SET 
        final_charge_amount = $1, 
        payment_status_code = $2, 
        updated_at = NOW(),
        paid_at = CASE WHEN $2 = 'PAID' AND paid_at IS NULL THEN NOW() WHEN $2 != 'PAID' THEN NULL ELSE paid_at END
      WHERE id = $3
    `, [chargeAmount, newStatus, shipmentId]);

    const jsonChanges = JSON.stringify({
      final_charge_amount: {
        old: oldCharge ? Number(oldCharge) : null,
        new: chargeAmount
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
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    console.error('Set Charge Error:', err);
    return { success: false, message: err instanceof Error ? err.message : 'Gagal menyimpan tagihan.' };
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

    await client.query(`
      INSERT INTO shipment_payments (shipment_id, payment_method_code, amount, payment_reference, paid_to)
      VALUES ($1, $2, $3, $4, $5)
    `, [shipmentId, paymentMethodCode, amount, paymentReference, paidTo]);

    const resShp = await client.query('SELECT final_charge_amount, amount_paid FROM customer_shipments WHERE id = $1', [shipmentId]);
    if (resShp.rows.length === 0) throw new Error('Karung tidak ditemukan');

    const finalCharge = parseFloat(resShp.rows[0].final_charge_amount || 0);
    const oldPaid = parseFloat(resShp.rows[0].amount_paid || 0);
    const newPaid = oldPaid + amount;
    const newStatus = resolvePaymentStatus(newPaid, finalCharge);

    await client.query(`
      UPDATE customer_shipments 
      SET 
        amount_paid = $1,
        payment_status_code = $2,
        paid_at = CASE WHEN $2 = 'PAID' AND paid_at IS NULL THEN NOW() WHEN $2 != 'PAID' THEN NULL ELSE paid_at END,
        updated_at = NOW()
      WHERE id = $3
    `, [newPaid, newStatus, shipmentId]);

    await client.query('COMMIT');

    revalidatePath('/finance');
    revalidatePath(`/finance/${shipmentId}`);

    return { success: true };
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    console.error('Add Payment Error:', err);
    return { success: false, message: err instanceof Error ? err.message : 'Gagal menyimpan transaksi pembayaran.' };
  } finally {
    client.release();
  }
}

export async function voidPaymentRecord(formData: FormData) {
  const paymentId = formData.get('payment_id') as string;
  const shipmentId = formData.get('shipment_id') as string;
  const reason = formData.get('reason') as string;

  if (!paymentId || !shipmentId || !reason) {
    return { success: false, message: 'ID atau alasan pembatalan tidak valid.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const payRes = await client.query('SELECT amount FROM shipment_payments WHERE id = $1', [paymentId]);
    if (payRes.rows.length === 0) throw new Error('Riwayat cicilan tidak ditemukan.');
    const voidedAmount = Number(payRes.rows[0].amount);

    await client.query('DELETE FROM shipment_payments WHERE id = $1', [paymentId]);

    const allPayRes = await client.query('SELECT SUM(amount) as total_paid FROM shipment_payments WHERE shipment_id = $1', [shipmentId]);
    const currentPaid = Number(allPayRes.rows[0].total_paid || 0);

    const shpRes = await client.query('SELECT final_charge_amount FROM customer_shipments WHERE id = $1 FOR UPDATE', [shipmentId]);
    const finalCharge = Number(shpRes.rows[0].final_charge_amount || 0);
    const newStatus = resolvePaymentStatus(currentPaid, finalCharge);

    await client.query(`
      UPDATE customer_shipments 
      SET amount_paid = $1, payment_status_code = $2, updated_at = NOW(),
          paid_at = CASE WHEN $2 = 'PAID' THEN COALESCE(paid_at, NOW()) ELSE NULL END
      WHERE id = $3
    `, [currentPaid, newStatus, shipmentId]);

    await client.query(`
      INSERT INTO system_audit_logs (
        entity_name, entity_id, action_type, changes_json,
        source_module, source_action, revision_note, revised_by, related_shipment_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      'FINANCE_PAYMENT', paymentId, 'VOID_PAYMENT_INSTALLMENT',
      JSON.stringify({ voided_amount: voidedAmount, new_total_paid: currentPaid, new_status: newStatus }),
      'FINANCE_CASHIER', 'voidPaymentRecord', reason, 'Admin Kasir Sesi', shipmentId
    ]);

    await client.query('COMMIT');
    revalidatePath(`/finance/${shipmentId}`);
    return { success: true, message: 'Cicilan uang masuk berhasil divoid dan dihitung ulang.' };
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    return { success: false, message: err instanceof Error ? err.message : 'Gagal menghapus riwayat pembayaran.' };
  } finally {
    client.release();
  }
}
