import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-nala-api-key');
    if (apiKey !== process.env.NALA_API_SECRET) {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const payload = await request.json();
    const { notification_log_ids, status, error_reason, provider_message_id } = payload;

    if (!notification_log_ids || !Array.isArray(notification_log_ids) || notification_log_ids.length === 0) {
      return NextResponse.json({ success: false, code: 'INVALID_PAYLOAD', message: 'Missing notification_log_ids array' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE notifications_log 
        SET 
          delivery_status_code = $1, 
          error_reason = COALESCE($2, error_reason),
          provider_message_id = COALESCE($3, provider_message_id),
          sent_at = CASE WHEN $1 = 'SENT' THEN NOW() ELSE sent_at END
        WHERE id = ANY($4::uuid[])
      `, [status, error_reason || null, provider_message_id || null, notification_log_ids]);

      return NextResponse.json({ success: true, message: `Updated ${notification_log_ids.length} logs to ${status}` });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Nala Notification Callback Error:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
