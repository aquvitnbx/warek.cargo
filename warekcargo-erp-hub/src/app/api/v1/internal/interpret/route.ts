import { NextResponse } from 'next/server';
import { isAuthorizedInternalRequest } from '@/lib/internal-api';
import { interpretIncomingMessage, type PartialSessionData } from '@/lib/message-intent';

type InterpretRequestPayload = {
  message?: string;
  phone?: string;
  partial_data?: PartialSessionData;
};

export async function POST(req: Request) {
  try {
    if (!isAuthorizedInternalRequest(req)) {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', human_message: 'Unauthorized access' }, { status: 401 });
    }

    const body = (await req.json()) as InterpretRequestPayload;
    const { message, partial_data } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({
        success: false,
        code: 'INVALID_PAYLOAD',
        human_message: 'Pesan teks wajib dikirim untuk interpretasi.'
      }, { status: 400 });
    }

    const result = interpretIncomingMessage(message, partial_data);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (err: unknown) {
    console.error('Internal interpret endpoint error:', err);

    return NextResponse.json({
      success: true,
      data: {
        intent: 'OTHER',
        extracted_data: {
          hub_selection: null,
          customer_name: null,
          packages: []
        },
        tracking_identifier: null,
        is_data_complete: false,
        missing_critical_fields: [],
        requires_clarification: true,
        clarification_question: null,
        recommended_action: 'REPLY_FALLBACK_ADMIN',
        human_reply_mode: 'FALLBACK_ADMIN'
      }
    });
  }
}
