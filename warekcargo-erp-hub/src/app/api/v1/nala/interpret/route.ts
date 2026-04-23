import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-nala-api-key');
    if (!authHeader || authHeader !== process.env.NALA_API_SECRET) {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', human_message: 'Unauthorized access' }, { status: 401 });
    }

    const body = await req.json();
    const { message, phone, partial_data } = body;

    if (!message) {
      return NextResponse.json({
        success: false,
        code: 'INVALID_PAYLOAD',
        human_message: 'Pesan teks wajib dikirim untuk interpretasi.'
      }, { status: 400 });
    }

    // Prepare context
    let systemPrompt = `Kamu adalah Nala, chatbot asisten operasional cerdas dari WarekCargo Hub.
Tugasmu adalah menganalisis pesan WhatsApp kustomer (mulai dari sapaan hingga deklarasi barang) dan mengekstrak intent serta data.
Pengiriman WarekCargo berpedoman pada "Hub-First Pre-Manifest Declaration".

Kategori Niat (intent):
1. LOOKUP: Pengguna ingin melacak resinya (contoh: "cek JKT-123", "resi ini sampai mana?").
2. INTAKE: Pengguna mendaftarkan paket, memilih hub, atau melengkapi multi-resi. Jawaban singkat seperti "Jakarta" WAJIB dikategorikan INTAKE.
3. OTHER: Sapaan awal, komplain, atau pertanyaan FAQ.

PENTING UNTUK INTENT LOOKUP (PRIORITAS MUTLAK OVERRIDE):
Jika kustomer secara eksplisit menyebut kata kerja pelacakan (contoh: "cek", "lacak", "status", "posisi", "di mana", "sampai mana") BERSAMA dengan nomor identifier/resi, maka kamu WAJIB memprioritaskan intent sebagai LOOKUP.
- Rule ini MENGALAHKAN / OVERRIDE sesi Intake yang sedang aktif. 
- Set \`intent = LOOKUP\` dan \`recommended_action = PROCEED_TO_LOOKUP\`.
- Ekstrak nomor resi tersebut ke dalam array \`packages\`, tepatnya di objek paket pertama (\`packages[0].tracking_number\`).
- Jika sebuah nomor resi masuk TANPA kata kerja pelacakan (hanya resi saja) saat sesi intake aktif, tetap anggap sebagai INTAKE paket tambahan.

Konteks Tambahan Pengguna Dikenali:
Jika di dalam "Data Sesi Sebelumnya" terdapat tanda "Customer Dikenali" dan pesan baru adalah sapaan awal murni ("Halo"), maka set \`recommended_action = REPLY_RETURNING_ONBOARDING\`, dan \`clarification_question: null\`.

PENTING UNTUK INTENT INTAKE (DEKLARASI PENGIRIMAN):
Proses Intake WAJIB bertahap:
- TAHAP 1 (Pilih Hub): Ekstrak \`hub_selection\`. Jika \`hub_selection\` TERCANTUM namun belum ada \`customer_name\` dan resi di \`packages\`, set \`recommended_action = REPLY_HUB_CONFIRMATION\`. Kamu WAJIB men-set \`clarification_question: null\` karena N8n akan merender alamat hub secara statis.
- TAHAP 2 (Lengkapi Manifest Multi-Resi): Kustomer bisa mendaftarkan LEBIH DARI SATU paket. Ekstrak kumpulan paket ke dalam list \`packages\`. Tiap paket butuh \`tracking_number\`, \`destination_city\`, dan \`item_description\`. 
  - *destination_city* boleh diwarisi jika kustomer tidak terlihat mengganti kota, tapi *item_description* TIDAK BOLEH diwarisi otomatis antar nomor resi yang berbeda!
  - Jika *item_description* dari satu resi baru ada yang kosong, set \`recommended_action = REPLY_CLARIFICATION\` dan tanya di \`clarification_question\` ("Nomor resi catat. Mohon informasikan isi barang untuk resi ini.").
- Jika 100% lengkap semua paket & nama & hub, set \`recommended_action = PROCEED_TO_INTAKE\`.

PENTING UNTUK INTENT OTHER (SAPAAN, EDUKASI, FALLBACK):
Terdapat 3 sub-skenario:
1. GREETING/SAPAAN: Jika bukan Customer Dikenali, set \`recommended_action = REPLY_ONBOARDING\`, \`clarification_question: null\`.
2. FIELD EXPLANATION: Jawaban ringkas di \`clarification_question\`. Set \`recommended_action = REPLY_FIELD_EXPLANATION\`.
3. FALLBACK: Set \`recommended_action = REPLY_FALLBACK_ADMIN\`, \`clarification_question: null\`.`;

    let userContent = `Pesan Pengguna: "${message}"`;
    if (partial_data && Object.keys(partial_data).length > 0) {
      let recognizedText = partial_data.recognized_name ? `(Customer Dikenali: ${partial_data.recognized_name}) ` : '';
      userContent = `Data Sesi Sebelumnya: ${recognizedText}${JSON.stringify(partial_data)}\n\n` + userContent;
    }

    const { object } = await generateObject({
      model: openai('gpt-4o-mini', { structuredOutputs: true }),
      schema: z.object({
        intent: z.enum(['INTAKE', 'LOOKUP', 'OTHER']),
        extracted_data: z.object({
          hub_selection: z.enum(['JAKARTA', 'SURABAYA', 'MAKASSAR']).nullable().describe('Hub penerimaan fisik (opsi wajib di tahap awal)'),
          customer_name: z.string().nullable().describe('Nama pemilik barang pengirim'),
          packages: z.array(z.object({
            tracking_number: z.string(),
            destination_city: z.string().nullable().describe('Kota pelabuhan tujuan pengiriman akhir paket ini (Nabire/Makassar)'),
            item_description: z.string().nullable().describe('Deskripsi singkat isi paket')
          })).describe('Koleksi atau himpunan paket/resi yang diinfokan')
        }),
        is_data_complete: z.boolean().describe('True if intent is INTAKE and ALL packages have complete fields'),
        missing_critical_fields: z.array(z.string()).describe('List of missing keys'),
        requires_clarification: z.boolean().describe('True if we need to ask user for missing info or onboarding'),
        clarification_question: z.string().nullable().describe('Text to send back to user if clarification/onboarding is needed. Must be polite. NULL for HUB_CONFIRM.'),
        recommended_action: z.enum(['PROCEED_TO_INTAKE', 'PROCEED_TO_LOOKUP', 'REPLY_ONBOARDING', 'REPLY_RETURNING_ONBOARDING', 'REPLY_HUB_CONFIRMATION', 'REPLY_FIELD_EXPLANATION', 'REPLY_CLARIFICATION', 'REPLY_FALLBACK_ADMIN']),
        human_reply_mode: z.enum(['INTAKE_CONFIRMATION', 'ONBOARDING', 'RETURNING_ONBOARDING', 'HUB_CONFIRMATION', 'FIELD_EXPLANATION', 'CLARIFICATION', 'LOOKUP', 'FALLBACK_ADMIN'])
      }),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      temperature: 0.0,
    });

    // Enforce completeness logic just to be safe
    if (object.intent === 'INTAKE') {
        let allPackagesComplete = true;
        if (!object.extracted_data.packages || object.extracted_data.packages.length === 0) {
           allPackagesComplete = false;
        } else {
           object.extracted_data.packages.forEach((pkg: any) => {
              if (!pkg.tracking_number || !pkg.item_description || !pkg.destination_city) allPackagesComplete = false;
           });
        }
        if (!object.extracted_data.customer_name || !object.extracted_data.hub_selection) allPackagesComplete = false;
        
        object.is_data_complete = allPackagesComplete;
    }

    // Explicit GUARDRAIL: ACTION REPLY_HUB_CONFIRMATION MUST HAVE hub_selection
    if (object.recommended_action === 'REPLY_HUB_CONFIRMATION' && !object.extracted_data.hub_selection) {
        object.recommended_action = 'REPLY_CLARIFICATION';
        object.clarification_question = 'Mohon maaf, Anda belum menyebutkan secara jelas. Hub penerimaan mana yang Anda tuju? (Jakarta, Surabaya, Makassar)';
        object.human_reply_mode = 'CLARIFICATION';
    }

    return NextResponse.json({
      success: true,
      data: object
    });

  } catch (err: any) {
    console.error("Nala Interpret Endpoint Error (Fallback triggered):", err);
    
    // Default safe fallback instead of throwing 500
    return NextResponse.json({
      success: true, 
      data: {
        intent: 'OTHER',
        extracted_data: {
          hub_selection: null,
          customer_name: null,
          packages: []
        },
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
