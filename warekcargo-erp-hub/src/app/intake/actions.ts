'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Fallback Guard: Jangan crash jika credential S3 tidak ada di .env lokal
let s3Client: S3Client | null = null;

if (process.env.NEO_ACCESS_KEY && process.env.NEO_SECRET_KEY && process.env.NEO_ENDPOINT) {
  s3Client = new S3Client({
    endpoint: process.env.NEO_ENDPOINT,
    region: process.env.NEO_REGION || 'custom',
    credentials: {
      accessKeyId: process.env.NEO_ACCESS_KEY,
      secretAccessKey: process.env.NEO_SECRET_KEY,
    },
    forcePathStyle: true, // Wajib bagi Object Storage alternatif (non-AWS standar)
  });
} else {
  console.warn("⚠️ [WarekCargo Warn] Konfigurasi S3/NEO di .env tidak lengkap. S3 Upload di-bypass untuk lokal dev.");
}

export async function submitIncomingPackage(formData: FormData) {
  const trackingNumber = formData.get('tracking_number') as string;
  const hubCode = formData.get('hub_id') as string;
  const packageStatusCode = formData.get('package_status_code') as string || 'RECEIVED_AT_HUB';
  const senderOrStore = formData.get('sender_name') as string || null;
  const itemDescription = formData.get('item_description') as string || null;
  const quantity = parseInt(formData.get('quantity') as string) || 1;
  const file = formData.get('file-upload') as File | null;
  let customerId: string | null = formData.get('customer_id') as string;
  
  if (!customerId || customerId.trim() === '') customerId = null;
  
  if (!trackingNumber) {
    return { success: false, message: 'Nomor Resi / STT wajib diisi.' };
  }
  
  if (!hubCode) {
    return { success: false, message: 'Cabang Darat (Hub) tidak boleh kosong.' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Dapatkan UUID Hub (HARUS VALID, HARD FAIL)
    const hubRes = await client.query('SELECT id FROM hubs WHERE code = $1 LIMIT 1', [hubCode]);
    if (hubRes.rows.length === 0) {
      throw new Error(`KODE CABANG / HUB TIDAK VALID DI SISTEM. Hub Code '${hubCode}' tidak diakui oleh Master Data.`);
    }
    const hubId = hubRes.rows[0].id;

    // 2. Insert tabel inbound_packages (atau Update Jika Duplikat)
    const upsertQuery = `
      INSERT INTO inbound_packages (tracking_number, hub_id, package_status_code, quantity, sender_or_store, item_description, customer_id, is_cod, received_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
      ON CONFLICT (tracking_number) 
      DO UPDATE SET 
        package_status_code = EXCLUDED.package_status_code,
        hub_id = EXCLUDED.hub_id,
        quantity = EXCLUDED.quantity,
        sender_or_store = EXCLUDED.sender_or_store,
        item_description = EXCLUDED.item_description,
        customer_id = EXCLUDED.customer_id,
        received_at = NOW(),
        updated_at = NOW()
      RETURNING id, package_status_code;
    `;
    const pkgRes = await client.query(upsertQuery, [trackingNumber, hubId, packageStatusCode, quantity, senderOrStore, itemDescription, customerId]);
    
    if (pkgRes.rows.length === 0) {
      throw new Error('Gagal meregistrasi log barang ke dalam sistem master.');
    }
    const packageId = pkgRes.rows[0].id;

    // 3. Rekam Jejak Titik Nol/Zero pada Histori
    await client.query(`
      INSERT INTO inbound_package_status_history (inbound_package_id, to_status_code, changed_source, change_notes) 
      VALUES ($1, $2, 'INTAKE_MODULE', 'Barang pertama kali didaftarkan oleh Admin Outlet')
    `, [packageId, packageStatusCode]);

    // 4. Proses File Upload (Opsional S3)
    if (file && file.size > 0 && s3Client) {
      try {
        const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
        const safeRegNum = trackingNumber.replace(/[^a-zA-Z0-9]/g, '');
        const s3Key = `warekcargo/hubs/${hubCode}/${safeRegNum}_${Date.now()}${fileExtension}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.NEO_BUCKET_NAME || 'mock-bucket',
          Key: s3Key,
          Body: buffer,
          ContentType: file.type || 'image/jpeg',
          ACL: 'public-read'
        }));

        const neoEndpoint = process.env.NEO_ENDPOINT?.replace(/\/$/, '');
        const dbFilePath = `${neoEndpoint}/${process.env.NEO_BUCKET_NAME}/${s3Key}`;

        // Suntikkan data foto yang melkat pada resi barang
        await client.query(
          `INSERT INTO package_photos (inbound_package_id, photo_type_code, file_path, original_filename, uploaded_by) 
           VALUES ($1, 'PACKAGE', $2, $3, 'Admin Hub')`,
           [packageId, dbFilePath, file.name]
        );
      } catch (uploadError: any) {
         // Jika gagal S3, gagalkan seluruh transaksi Intake
         throw new Error('Upload Foto Bukti S3 gagal: ' + uploadError.message);
      }
    }

    await client.query('COMMIT');
    revalidatePath('/');
    return { success: true, message: 'Paket berhasil dicatat dengan aman.' };

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Intake Strict Error:', error);
    return { success: false, message: error.message || 'Gagal menyimpan transaksi.' };
  } finally {
    client.release();
  }
}

export async function createCustomerInline(formData: FormData) {
  const full_name = formData.get('full_name')?.toString() || '';
  let whatsapp_number = formData.get('whatsapp_number')?.toString() || '';
  const destination_city = formData.get('destination_city')?.toString() || 'Nabire';

  if (!full_name || !whatsapp_number) {
     return { success: false, message: 'Nama dan WhatsApp wajib diisi.' };
  }

  // Sanity check WA
  whatsapp_number = whatsapp_number.replace(/\D/g, '');
  if (!whatsapp_number.startsWith('62')) {
    whatsapp_number = '62' + whatsapp_number.replace(/^0+/, '');
  }

  try {
    const res = await pool.query(`
      INSERT INTO customers (full_name, whatsapp_number, destination_city)
      VALUES ($1, $2, $3)
      RETURNING id, full_name, whatsapp_number
    `, [full_name, whatsapp_number, destination_city]);
    
    return { success: true, customer: res.rows[0] };
  } catch (err: any) {
    if (err.code === '23505') {
       return { success: false, message: 'Nomor WhatsApp sudah terdaftar di sistem.' };
    }
    return { success: false, message: 'Gagal membuat pelanggan baru.' };
  }
}

export async function updateIntakePackage(formData: FormData) {
  const packageId = formData.get('package_id') as string;
  let newCustomerId = formData.get('customer_id') as string | null;
  const newSender = formData.get('sender_or_store') as string || null;
  const newDescription = formData.get('item_description') as string || null;
  const newMarketplace = formData.get('marketplace_code') as string || null;
  const newQuantity = parseInt(formData.get('quantity') as string);
  const newCondition = formData.get('condition_notes') as string || null;
  const newAdminNotes = formData.get('admin_notes') as string || null;
  const revisionNote = formData.get('revision_note') as string || '';

  if (!newCustomerId || newCustomerId.trim() === '') newCustomerId = null;
  if (!packageId) return { success: false, message: 'ID Paket raib.' };
  if (revisionNote.length < 5) return { success: false, message: 'Alasan Koreksi administratif wajib diisi jelas.' };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Dapatkan data lama & periksa ikatan relasi
    const resPrev = await client.query('SELECT * FROM inbound_packages WHERE id = $1 FOR UPDATE', [packageId]);
    if (resPrev.rows.length === 0) throw new Error("Paket tidak valid.");
    const old = resPrev.rows[0];

    // Cek relasi ke shipment (Karung)
    const relRes = await client.query('SELECT COUNT(*) as count FROM shipment_packages WHERE inbound_package_id = $1', [packageId]);
    const isBound = parseInt(relRes.rows[0].count) > 0;

    // 2. Terapkan HARD LOCK relasional
    const customerChanged = old.customer_id !== newCustomerId;
    const quantityChanged = old.quantity !== newQuantity;
    const marketplaceChanged = (old.marketplace_code || null) !== newMarketplace;

    if (isBound && (customerChanged || quantityChanged || marketplaceChanged)) {
       throw new Error("Sistem Terkunci (HARD LOCK). Paket ini sudah terikat masuk ke dalam resi Karung Gabungan. Anda tidak dilarang mengubah Data Pelanggan, Kuantitas, atau Marketplace kecuali Karungnya dibongkar lebih dulu.");
    }

    // 3. Update data paket
    await client.query(`
      UPDATE inbound_packages
      SET 
        customer_id = $1, quantity = $2, sender_or_store = $3, 
        item_description = $4, marketplace_code = $5, condition_notes = $6, 
        admin_notes = $7, updated_at = NOW()
      WHERE id = $8
    `, [newCustomerId, newQuantity, newSender, newDescription, newMarketplace, newCondition, newAdminNotes, packageId]);

    // 4. Catat Audit Log
    const jsonChanges: any = {};
    if (customerChanged) jsonChanges.customer_id = { old: old.customer_id, new: newCustomerId };
    if (quantityChanged) jsonChanges.quantity = { old: old.quantity, new: newQuantity };
    if (old.sender_or_store !== newSender) jsonChanges.sender_or_store = { old: old.sender_or_store, new: newSender };
    if (old.item_description !== newDescription) jsonChanges.item_description = { old: old.item_description, new: newDescription };
    if (old.marketplace_code !== newMarketplace) jsonChanges.marketplace_code = { old: old.marketplace_code, new: newMarketplace };
    if (old.condition_notes !== newCondition) jsonChanges.condition_notes = { old: old.condition_notes, new: newCondition };
    if (old.admin_notes !== newAdminNotes) jsonChanges.admin_notes = { old: old.admin_notes, new: newAdminNotes };

    if (Object.keys(jsonChanges).length > 0) {
      await client.query(`
        INSERT INTO system_audit_logs (
          entity_name, entity_id, action_type, changes_json,
          source_module, source_action, revision_note, revised_by, related_package_id
        ) VALUES (
          $1, $2, $3, $4, 
          $5, $6, $7, $8, $9
        )
      `, [
         'INBOUND_PACKAGE', packageId, 'CORRECT_INTAKE_DATA', JSON.stringify(jsonChanges),
         'INTAKE_MODULE', 'updateIntakePackage', revisionNote, 'Admin Intake Sesi', packageId
      ]);
    }

    await client.query('COMMIT');
    revalidatePath('/intake');
    revalidatePath(`/intake/${old.tracking_number}`);
    revalidatePath('/packages');
    return { success: true };
  } catch (err: any) {
    await client.query('ROLLBACK');
    return { success: false, message: err.message || 'Gagal mengubah manifest.' };
  } finally {
    client.release();
  }
}

export async function voidIntakePackage(packageId: string, revisionNote: string) {
  if (!packageId || revisionNote.length < 5) return { success: false, message: 'Data atau alasan void tidak valid.' };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resPrev = await client.query('SELECT package_status_code, tracking_number FROM inbound_packages WHERE id = $1 FOR UPDATE', [packageId]);
    if (resPrev.rows.length === 0) throw new Error("Paket tak bersisa.");
    const oldStatus = resPrev.rows[0].package_status_code;

    if (oldStatus === 'CANCELLED') throw new Error("Sudah di-Void sebelumnya.");

    // Cek Relasional
    const relRes = await client.query('SELECT COUNT(*) as count FROM shipment_packages WHERE inbound_package_id = $1', [packageId]);
    if (parseInt(relRes.rows[0].count) > 0) {
       throw new Error("Sistem Terkunci. Tidak dapat me-Void paket yang sudah tergabung ke Karung (CONSOLE). Bongkar dahulu karungnya.");
    }

    // Set Status
    await client.query(`UPDATE inbound_packages SET package_status_code = 'CANCELLED', updated_at = NOW() WHERE id = $1`, [packageId]);

    // History & Audit Log
    await client.query(`
       INSERT INTO inbound_package_status_history (inbound_package_id, from_status_code, to_status_code, changed_source, change_notes) 
       VALUES ($1, $2, 'CANCELLED', 'INTAKE_MODULE', 'Void / Pembatalan Resi Barcode')
    `, [packageId, oldStatus]);

    const jsonChanges = JSON.stringify({ "package_status_code": { "old": oldStatus, "new": "CANCELLED" } });
    await client.query(`
      INSERT INTO system_audit_logs (
        entity_name, entity_id, action_type, changes_json, source_module, source_action, revision_note, revised_by, related_package_id
      ) VALUES ($1, $2, 'VOID_INTAKE_PACKAGE', $3, 'INTAKE_MODULE', 'voidIntakePackage', $4, 'Admin Utama', $5)
    `, ['INBOUND_PACKAGE', packageId, jsonChanges, revisionNote, packageId]);

    await client.query('COMMIT');
    revalidatePath('/intake');
    revalidatePath(`/intake/${resPrev.rows[0].tracking_number}`);
    revalidatePath('/packages');
    return { success: true };
  } catch (err: any) {
    await client.query('ROLLBACK');
    return { success: false, message: err.message };
  } finally {
    client.release();
  }
}
