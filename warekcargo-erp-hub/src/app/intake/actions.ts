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
  const hubCode = formData.get('hub_id') as string || 'JKT';
  const packageStatusCode = formData.get('package_status_code') as string || 'RECEIVED_AT_HUB';
  const senderOrStore = formData.get('sender_name') as string || null;
  const itemDescription = formData.get('item_description') as string || null;
  const quantity = parseInt(formData.get('quantity') as string) || 1;
  const file = formData.get('file-upload') as File | null;
  let customerId: string | null = formData.get('customer_id') as string;
  
  if (!customerId || customerId.trim() === '') customerId = null;
  
  if (!trackingNumber) {
    throw new Error('Resi wajib diisi');
  }

  try {
    let hubId: any = 'mock-hub-id';
    let packageId: string = 'mock-pkg-id';

    // 1. Dapatkan UUID Hub
    if (process.env.DATABASE_URL) {
      const hubRes = await pool.query('SELECT id FROM hubs WHERE code = $1 LIMIT 1', [hubCode]);
      if (hubRes.rows.length === 0) {
        console.warn('Hub tidak valid di DB, meneruskan mock...');
      } else {
         hubId = hubRes.rows[0].id;
      }
    }

    // 2. Insert tabel inbound_packages
    if (process.env.DATABASE_URL && hubId !== 'mock-hub-id') {
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
        RETURNING id;
      `;
      const pkgRes = await pool.query(upsertQuery, [trackingNumber, hubId, packageStatusCode, quantity, senderOrStore, itemDescription, customerId]);
      if (pkgRes.rows.length > 0) {
         packageId = pkgRes.rows[0].id;
      }
    } else {
      console.warn("DB Bypass: Entry resi hanya di-mock secara memori lokal.");
    }

    // 3. Proses File Upload
    if (file && file.size > 0) {
      if (!s3Client) {
        console.warn("S3 Bypass: File bukti diterima tapi diabaikan karena config S3 kosong.");
      } else {
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

        if (process.env.DATABASE_URL && packageId !== 'mock-pkg-id') {
          await pool.query(
            `INSERT INTO package_photos (inbound_package_id, photo_type_code, file_path, original_filename, uploaded_by) 
             VALUES ($1, 'PACKAGE', $2, $3, 'Admin Hub')`,
             [packageId, dbFilePath, file.name]
          );
        }
      }
    }

    revalidatePath('/');
    return { success: true, message: 'Paket berhasil dicatat (Mode ' + (process.env.DATABASE_URL ? 'Live' : 'Lokal') + ')' };

  } catch (error: any) {
    console.error('Insert error:', error);
    return { success: false, message: error.message || 'Gagal.' };
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
        RETURNING id, full_name, whatsapp_number, customer_code
     `, [full_name, whatsapp_number, destination_city]);
     
     // Optionally trigger a revalidatePath if the list is fetched on the server
     revalidatePath('/intake');
     
     return { success: true, data: res.rows[0] };
  } catch (err: any) {
    if (err.code === '23505') {
       return { success: false, message: 'Nomor WhatsApp sudah terdaftar.' };
    }
    return { success: false, message: err.message || 'Gagal menyimpan customer.' };
  }
}
