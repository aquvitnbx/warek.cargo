import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { isAuthorizedInternalRequest } from '@/lib/internal-api';

type SessionPayload = {
  phone?: string;
  intent?: string;
  partial_data?: Record<string, unknown>;
  missing_critical_fields?: string[];
  is_data_complete?: boolean;
  session_id?: string | null;
};

export async function GET(req: Request) {
  if (!isAuthorizedInternalRequest(req)) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ success: false, code: 'INVALID_PAYLOAD' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const custRes = await client.query('SELECT full_name FROM customers WHERE whatsapp_number = $1 LIMIT 1', [phone]);
    if (custRes.rowCount > 0) {
      return NextResponse.json({
        success: true,
        code: 'NO_ACTIVE_SESSION_BUT_RECOGNIZED_CUSTOMER',
        message: 'Session state internal sudah dimatikan; hanya konteks customer yang dikenali.',
        data: { recognized_name: custRes.rows[0].full_name }
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      code: 'NO_ACTIVE_SESSION',
      message: 'Session state internal sudah dimatikan.'
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching internal session context:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: Request) {
  if (!isAuthorizedInternalRequest(req)) {
    return NextResponse.json({ success: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as SessionPayload;
    const { phone, intent, partial_data = {}, missing_critical_fields = [], is_data_complete, session_id } = body;

    if (!phone) {
      return NextResponse.json({ success: false, code: 'INVALID_PAYLOAD', human_message: 'Nomor WA tidak valid.' }, { status: 400 });
    }

    const status = intent === 'OTHER' || intent === 'CANCEL'
      ? 'CANCELLED'
      : is_data_complete
        ? 'COMPLETED'
        : 'STATELESS';

    return NextResponse.json({
      success: true,
      code: 'SESSION_BYPASSED',
      message: 'Session state internal sudah dimatikan; caller sebaiknya meneruskan context sendiri.',
      data: {
        session_id: session_id || null,
        status,
        partial_data,
        missing_critical_fields,
      }
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error bypassing internal session state:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
