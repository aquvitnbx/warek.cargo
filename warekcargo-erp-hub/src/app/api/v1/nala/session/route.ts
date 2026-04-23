import { NextResponse } from "next/server";
import pool from "@/lib/db";

const NALA_API_SECRET = process.env.NALA_API_SECRET || "NalaWarekCargo2026_SecureM2M_Secret";

export async function GET(req: Request) {
  const secret = req.headers.get("x-nala-api-key");
  if (secret !== NALA_API_SECRET) {
    return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ success: false, code: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    // Look for active session
    const res = await client.query(
      `SELECT id, intent, partial_data, missing_critical_fields, expires_at 
       FROM nala_chat_sessions 
       WHERE phone = $1 AND session_status = 'AWAITING_CLARIFICATION' AND expires_at > NOW() 
       ORDER BY updated_at DESC LIMIT 1`,
      [phone]
    );

    if (res.rowCount === 0) {
      // Tidak ada sesi aktif. Cek apakah ini Kustomer lama yang dikenali.
      const custRes = await client.query('SELECT full_name FROM customers WHERE whatsapp_number = $1 LIMIT 1', [phone]);
      if (custRes.rowCount > 0) {
         return NextResponse.json({ 
           success: true, 
           code: "NO_ACTIVE_SESSION_BUT_RECOGNIZED_CUSTOMER", 
           message: "Tidak ada sesi aktif namun data kustomer dikenali.",
           data: { recognized_name: custRes.rows[0].full_name }
         }, { status: 200 });
      }

      return NextResponse.json({ success: true, code: "NO_ACTIVE_SESSION", message: "Tidak ada sesi aktif." }, { status: 200 });
    }

    const session = res.rows[0];
    return NextResponse.json({
      success: true,
      code: "FOUND_ACTIVE_SESSION",
      data: {
        session_id: session.id,
        intent: session.intent,
        partial_data: session.partial_data,
        missing_critical_fields: session.missing_critical_fields
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ success: false, code: "INTERNAL_ERROR" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req: Request) {
  const secret = req.headers.get("x-nala-api-key");
  if (secret !== NALA_API_SECRET) {
    return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phone, intent, partial_data = {}, missing_critical_fields = [], is_data_complete, session_id } = body;

    if (!phone) {
      return NextResponse.json({ success: false, code: "INVALID_PAYLOAD", human_message: "Nomor WA tidak valid." }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      if (session_id) {
        // Fetch existing session first to deduplicate and guardrail the merge
        const existingRes = await client.query(`SELECT partial_data FROM nala_chat_sessions WHERE id = $1`, [session_id]);
        if (existingRes.rowCount > 0) {
          const oldData = existingRes.rows[0].partial_data || {};
          let mergedPackages = oldData.packages || [];
          
          if (partial_data.packages && Array.isArray(partial_data.packages)) {
            partial_data.packages.forEach((newPkg: any) => {
               if (!newPkg.tracking_number) return;
               const existIdx = mergedPackages.findIndex((p: any) => p.tracking_number === newPkg.tracking_number);
               if (existIdx > -1) {
                  // Update existing package with new info if previously missing
                  if (!mergedPackages[existIdx].item_description && newPkg.item_description) {
                     mergedPackages[existIdx].item_description = newPkg.item_description;
                  }
                  if (!mergedPackages[existIdx].destination_city && newPkg.destination_city) {
                     mergedPackages[existIdx].destination_city = newPkg.destination_city;
                  }
               } else {
                  // Append new tracking number
                  mergedPackages.push(newPkg);
               }
            });
          }
          partial_data.packages = mergedPackages;
        }

        // Update existing session
        const status = is_data_complete ? 'COMPLETED' : 'AWAITING_CLARIFICATION';
        
        // If explicit cancel
        const finalStatus = (intent === 'OTHER' || intent === 'CANCEL') ? 'CANCELLED' : status;

        await client.query(
          `UPDATE nala_chat_sessions 
           SET partial_data = $1, missing_critical_fields = $2, session_status = $3, intent = $4, expires_at = NOW() + INTERVAL '10 minutes', updated_at = NOW()
           WHERE id = $5`,
          [partial_data, JSON.stringify(missing_critical_fields), finalStatus, intent, session_id]
        );

        return NextResponse.json({ success: true, code: "SESSION_UPDATED", data: { session_id, status: finalStatus } }, { status: 200 });
      } else {
        // Create new session
        const status = is_data_complete ? 'COMPLETED' : 'AWAITING_CLARIFICATION';
        const finalStatus = (intent === 'OTHER' || intent === 'CANCEL') ? 'CANCELLED' : status;

        const res = await client.query(
          `INSERT INTO nala_chat_sessions (phone, intent, partial_data, missing_critical_fields, session_status, expires_at)
           VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '10 minutes')
           RETURNING id`,
          [phone, intent, partial_data, JSON.stringify(missing_critical_fields), finalStatus]
        );

        return NextResponse.json({ success: true, code: "SESSION_CREATED", data: { session_id: res.rows[0].id, status: finalStatus } }, { status: 200 });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error modifying session:", error);
    return NextResponse.json({ success: false, code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
