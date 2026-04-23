import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-nala-api-key');
    if (!authHeader || authHeader !== process.env.NALA_API_SECRET) {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', human_message: 'Unauthorized access' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      phone, 
      owner_name, 
      hub_selection, 
      packages
    } = body;

    // Payload Validation
    if (!phone || !packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json({
        success: false,
        code: 'INVALID_PAYLOAD',
        human_message: 'Phone dan daftar resi paket (packages) wajib diisi.'
      });
    }

    // Sanitize WA just in case it wasn't done completely
    const sanitizedPhone = phone.toString().replace(/^08/, '628').replace(/\D/g, '');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Hub Resolution
      if (!hub_selection) {
          await client.query('ROLLBACK');
          return NextResponse.json({
            success: false,
            code: 'INVALID_HUB',
            human_message: 'Pilihan Hub/Cabang penerimaan tidak diberikan.'
          });
      }

      const hubRes = await client.query('SELECT id, city FROM hubs WHERE LOWER(city) = LOWER($1) OR LOWER(name) = LOWER($1) LIMIT 1', [hub_selection.trim()]);
      if (hubRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({
          success: false,
          code: 'INVALID_HUB',
          human_message: `Maaf, Resi tidak dapat didaftarkan karena Cabang/Hub (${hub_selection}) tidak ditemukan dalam sistem kami.`
        });
      }
      const hubId = hubRes.rows[0].id;

      // 2. Actor (Operator) Identification
      let employeeId = null;
      let assignedAdminName = null;
      const empRes = await client.query('SELECT id, full_name FROM public.employees WHERE whatsapp_number = $1 AND is_active = true LIMIT 1', [sanitizedPhone]);
      if (empRes.rows.length > 0) {
        employeeId = empRes.rows[0].id;
        assignedAdminName = empRes.rows[0].full_name;
      }

      // 3. Customer Resolution (Separating Actor from Owner)
      let customerId = null;
      if (!employeeId) {
        const custRes = await client.query('SELECT id FROM customers WHERE whatsapp_number = $1', [sanitizedPhone]);
        if (custRes.rows.length > 0) {
          customerId = custRes.rows[0].id;
        } else {
          // Dest city for customer record uses first package approx
          const defaultDest = packages[0].destination_city || 'Nabire';
          const insertCust = await client.query(`
            INSERT INTO customers (customer_code, full_name, whatsapp_number, destination_city, is_active)
            VALUES ($1, $2, $3, $4, true)
            RETURNING id
          `, [`CUST-${sanitizedPhone}`, owner_name || 'Hamba Allah', sanitizedPhone, defaultDest]);
          customerId = insertCust.rows[0].id;
        }
      } else {
        const defaultDest = packages[0].destination_city || 'Nabire';
        const custIdempotentStr = `CUST-WALKIN-${packages[0].tracking_number}`;
        const insertWalkInCust = await client.query(`
          INSERT INTO customers (customer_code, full_name, whatsapp_number, destination_city, is_active)
          VALUES ($1, $2, NULL, $3, true)
          RETURNING id
        `, [custIdempotentStr, owner_name || 'Hamba Allah', defaultDest]);
        customerId = insertWalkInCust.rows[0].id;
      }

      // 4. BULK INSERT PACKAGES
      const results: Array<any> = [];
      const createdTrackingNumbers: string[] = [];

      for (const pkg of packages) {
         if (!pkg.tracking_number) {
            continue;
         }
         
         const trackingNum = pkg.tracking_number.trim();
         // Idempotency Check per package
         const checkResi = await client.query('SELECT id FROM inbound_packages WHERE tracking_number = $1', [trackingNum]);
         if (checkResi.rows.length > 0) {
            results.push({ tracking_number: trackingNum, status: 'DUPLICATE', message: 'Sudah terdaftar' });
            continue;
         }

         if (!pkg.item_description) {
            results.push({ tracking_number: trackingNum, status: 'MISSING_INFO', message: 'Isi barang kosong' });
            continue;
         }

         const packageTicketCode = `PKG-${trackingNum}`;
         const finalDest = pkg.destination_city || 'Nabire'; // Just fallback if empty

         const insertPkg = await client.query(`
            INSERT INTO inbound_packages (
            package_ticket_code, customer_id, hub_id, tracking_number,
            sender_or_store, item_description, quantity, package_status_code,
            is_cod, customer_declared_at, assigned_admin, created_by_employee_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, 1, 'AWAITING_HUB_RECEIPT', false, NOW(), $7, $8)
            RETURNING id
         `, [
            packageTicketCode, customerId, hubId, trackingNum,
            null, pkg.item_description, assignedAdminName, employeeId
         ]);
         const packageId = insertPkg.rows[0].id;

         await client.query(`
            INSERT INTO inbound_package_status_history (inbound_package_id, to_status_code, changed_source, change_notes, changed_by_employee_id, changed_by)
            VALUES ($1, 'AWAITING_HUB_RECEIPT', 'NALA_BOT', 'Pendaftaran Intake Melalui WhatsApp Nala Bot', $2, $3)
         `, [packageId, employeeId, assignedAdminName]);

         results.push({ tracking_number: trackingNum, status: 'CREATED', message: 'Berhasil' });
         createdTrackingNumbers.push(trackingNum);
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        code: 'INTAKE_PROCESSED',
        results: results,
        human_message: `Memproses ${packages.length} resi. Berhasil: ${createdTrackingNumbers.length}.`
      });

    } catch (dbErr: any) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }

  } catch (err: any) {
    console.error("Nala Intake Endpoint Error:", err);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', human_message: 'Malfungsi internal saat mengolah pesan Nala.' }, { status: 500 });
  }
}
