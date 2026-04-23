'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { processShipmentNotification } from '@/lib/notifications';

export async function updateDeliveryStatus(formData: FormData) {
  const shipmentId = formData.get('shipment_id') as string;
  const newDeliveryStatus = formData.get('delivery_status') as string;
  const recipientName = formData.get('delivery_recipient_name') as string || null;
  const notes = formData.get('delivery_notes') as string || null;

  if (!shipmentId || !newDeliveryStatus) {
    return { success: false, message: 'Data tidak lengkap' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Dapatkan status saat ini
    const currRes = await client.query(
      'SELECT shipment_status_code, pickup_delivery_status_code FROM customer_shipments WHERE id = $1 FOR UPDATE',
      [shipmentId]
    );

    if (currRes.rows.length === 0) {
      throw new Error('Shipment tidak ditemukan');
    }

    const { shipment_status_code: currentShipmentStatus, pickup_delivery_status_code: currentDeliveryStatus } = currRes.rows[0];

    // Jika status tidak berubah, tidak perlu lakukan apa-apa
    if (newDeliveryStatus === currentDeliveryStatus && currentShipmentStatus === 'COMPLETED') {
       await client.query('ROLLBACK');
       return { success: true, message: 'Tidak ada perubahan status.' };
    }

    // 2. Tentukan otomatisasi status Utama (Shipment Status)
    let nextShipmentStatus = currentShipmentStatus;
    let completedAtVal = null;
    let setCompletedSql = "";
    const params: any[] = [
       newDeliveryStatus, 
       recipientName, 
       notes, 
       shipmentId
    ];

    if (newDeliveryStatus === 'PICKED_UP' || newDeliveryStatus === 'DELIVERED') {
       nextShipmentStatus = 'COMPLETED';
       setCompletedSql = ", completed_at = NOW()";
    }

    // 3. Update tabel customer_shipments
    await client.query(`
      UPDATE customer_shipments 
      SET 
        pickup_delivery_status_code = $1,
        delivery_recipient_name = COALESCE($2, delivery_recipient_name),
        delivery_notes = COALESCE($3, delivery_notes),
        shipment_status_code = $4,
        updated_at = NOW()
        ${setCompletedSql}
      WHERE id = $5
    `, [newDeliveryStatus, recipientName, notes, nextShipmentStatus, shipmentId]);

    // 4. Rekam jejak di shipment_status_history
    const historyNotes = `Delivery Status berubah dari ${currentDeliveryStatus} menjadi ${newDeliveryStatus}. ` + 
                         (recipientName ? `Penerima: ${recipientName}. ` : '') + 
                         (notes ? `Catatan: ${notes}` : '');

    await client.query(`
      INSERT INTO shipment_status_history (
        shipment_id, from_status_code, to_status_code, changed_by, changed_source, change_notes
      ) VALUES ($1, $2, $3, 'Admin Delivery', 'Delivery Dashboard', $4)
    `, [shipmentId, currentShipmentStatus, nextShipmentStatus, historyNotes]);

    // 5. Trigger notifications for COMPLETED status
    if (nextShipmentStatus === 'COMPLETED' && currentShipmentStatus !== 'COMPLETED') {
       await processShipmentNotification(shipmentId, 'COMPLETED', client);
    }

    await client.query('COMMIT');
    
    // Revalidate paths
    revalidatePath('/delivery');
    revalidatePath(`/delivery/${shipmentId}`);
    revalidatePath('/tracking');
    revalidatePath(`/tracking/${shipmentId}`);

    return { success: true, message: 'Status pengiriman berhasil diperbarui.' };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Update delivery error:', error);
    return { success: false, message: error.message || 'Gagal memperbarui status.' };
  } finally {
    client.release();
  }
}
