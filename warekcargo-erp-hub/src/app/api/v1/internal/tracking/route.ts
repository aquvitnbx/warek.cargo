import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAuthorizedInternalRequest } from '@/lib/internal-api';

const STATUS_DICTIONARY: Record<string, string> = {
  AWAITING_HUB_RECEIPT: 'Data paket sudah terdaftar. Barang sedang menunggu diterima secara fisik di hub WarekCargo.',
  REGISTERED: 'Data pengiriman sudah terdaftar di sistem.',
  RECEIVED_AT_HUB: 'Paket sudah tiba dan diterima fisik di Hub/Cabang awal.',
  REPACKING: 'Paket sedang dalam proses sortir dan konsolidasi pengemasan.',
  CONSOLIDATED: 'Telah dikemas dalam unit Karung/Koli besar dan siap menunggu kapal.',
  REPACKED: 'Telah selesai dikemas ulang.',
  READY_FOR_BATCH: 'Paket/Karung sudah dialokasikan ke jadwal keberangkatan.',
  MANIFESTED: 'Paket Anda sudah dijadwalkan naik armada pengiriman dan sedang menunggu keberangkatan.',
  SHIPPED: 'Sudah diberangkatkan (diserahkan ke vendor pelayaran / kapal).',
  DISPATCHED: 'Sedang berlayar / dalam perjalanan armada menuju pelabuhan tujuan.',
  ON_TRANSIT: 'Sedang dalam perjalanan menuju kota transit/tujuan.',
  ARRIVED_DESTINATION: 'Sudah tiba di Hub/Cabang kota destinasi akhir.',
  READY_FOR_PICKUP: 'Paket sudah selesai dibongkar muat dan siap diambil di Cabang.',
  OUT_FOR_DELIVERY: 'Paket sedang dibawa kurir dari hub menuju alamat Anda.',
  DELIVERED: 'Selesai (Sudah diserahkan ke penerima).',
  DAMAGED: 'Terdapat insiden kendala fisik/kerusakan. Mohon hubungi admin kami.',
  UNIDENTIFIED: 'Bongkaran paket tidak memiliki identitas pemilik yang jelas.',
  CANCELLED: 'Pengiriman dibatalkan / Resi tidak berlaku.'
};

export async function GET(req: Request) {
  if (!isAuthorizedInternalRequest(req)) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get('awb')?.trim();

  if (!identifier) {
    return NextResponse.json({
      success: true,
      code: 'INVALID_IDENTIFIER',
      human_message: 'Maaf, format kode pelacakan tidak valid.'
    }, { status: 200 });
  }

  const client = await pool.connect();
  try {
    const shipmentRes = await client.query(
      'SELECT * FROM customer_shipments WHERE shipment_code = $1 LIMIT 1',
      [identifier]
    );

    if (shipmentRes.rowCount > 0) {
      const shipment = shipmentRes.rows[0];
      const historyRes = await client.query(
        `SELECT to_status_code, changed_at FROM shipment_status_history
         WHERE shipment_id = $1 ORDER BY changed_at DESC LIMIT 1`,
        [shipment.id]
      );

      const lastStatus = historyRes.rowCount > 0 ? historyRes.rows[0].to_status_code : 'UNKNOWN';
      const lastUpdated = historyRes.rowCount > 0 ? historyRes.rows[0].changed_at : shipment.created_at;
      const humanText = STATUS_DICTIONARY[lastStatus] || `Status: ${lastStatus}`;
      const dateString = new Date(lastUpdated).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

      return NextResponse.json({
        success: true,
        code: 'TRACKING_FOUND',
        human_message: `📦 *Hasil Pelacakan (${identifier})*\nStatus Pengiriman: *${humanText}*\nUpdate Terakhir: ${dateString} WIB.`
      });
    }

    const packageRes = await client.query(
      'SELECT * FROM inbound_packages WHERE tracking_number = $1 OR package_ticket_code = $1 LIMIT 1',
      [identifier]
    );

    if (packageRes.rowCount > 0) {
      const pkg = packageRes.rows[0];
      let lastStatus = 'RECEIVED_AT_HUB';
      let lastUpdated = pkg.created_at;

      const assocRes = await client.query(
        'SELECT shipment_id FROM shipment_packages WHERE inbound_package_id = $1 LIMIT 1',
        [pkg.id]
      );

      if (assocRes.rowCount > 0) {
        const shipmentId = assocRes.rows[0].shipment_id;
        const shipmentHistory = await client.query(
          `SELECT to_status_code, changed_at FROM shipment_status_history
           WHERE shipment_id = $1 ORDER BY changed_at DESC LIMIT 1`,
          [shipmentId]
        );

        if (shipmentHistory.rowCount > 0) {
          lastStatus = shipmentHistory.rows[0].to_status_code;
          lastUpdated = shipmentHistory.rows[0].changed_at;
        }
      } else {
        const historyRes = await client.query(
          `SELECT to_status_code, changed_at FROM inbound_package_status_history
           WHERE inbound_package_id = $1 ORDER BY changed_at DESC LIMIT 1`,
          [pkg.id]
        );

        if (historyRes.rowCount > 0) {
          lastStatus = historyRes.rows[0].to_status_code;
          lastUpdated = historyRes.rows[0].changed_at;
        }
      }

      const humanText = STATUS_DICTIONARY[lastStatus] || `Status: ${lastStatus}`;
      const dateString = new Date(lastUpdated).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

      return NextResponse.json({
        success: true,
        code: 'TRACKING_FOUND',
        human_message: `📦 *Hasil Pelacakan Paket (${identifier})*\nStatus: *${humanText}*\nUpdate Terakhir: ${dateString} WIB.`
      });
    }

    return NextResponse.json({
      success: true,
      code: 'NOT_FOUND',
      human_message: `❌ Maaf, resi atau kode pengiriman *${identifier}* tidak ditemukan di sistem WarekCargo. Mohon periksa kembali ejaan Anda.`
    });
  } catch (error: unknown) {
    console.error('Tracking lookup error:', error);
    return NextResponse.json({
      success: false,
      code: 'INTERNAL_ERROR',
      human_message: 'Sistem pencarian sedang mengalami gangguan. Mohon coba lagi beberapa saat.'
    }, { status: 500 });
  } finally {
    client.release();
  }
}
