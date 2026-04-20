'use server';

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Setup S3 Client specifically for Neo Object Storage
const s3Client = new S3Client({
  endpoint: process.env.NEO_ENDPOINT,
  region: process.env.NEO_REGION || 'custom',
  credentials: {
    accessKeyId: process.env.NEO_ACCESS_KEY!,
    secretAccessKey: process.env.NEO_SECRET_KEY!,
  },
  forcePathStyle: true, // Wajib bagi Object Storage alternatif (non-AWS standar)
});

export async function submitIncomingPackage(formData: FormData) {
  const trackingNumber = formData.get('tracking_number') as string;
  const hubCode = formData.get('hub_id') as string;
  const file = formData.get('file-upload') as File | null;
  
  if (!trackingNumber || !hubCode) {
    return { success: false, message: 'Resi dan Hub wajib diisi' };
  }

  try {
    // 1. Dapatkan UUID Hub dari tabel hubs berdasarkan kode
    const hubRes = await pool.query('SELECT id FROM hubs WHERE code = $1 LIMIT 1', [hubCode]);
    if (hubRes.rows.length === 0) throw new Error('Hub tidak valid');
    const hubId = hubRes.rows[0].id;

    let packageId: string;

    // 2. Insert atau Upsert ke tabel inbound_packages
    const upsertQuery = `
      INSERT INTO inbound_packages (tracking_number, hub_id, package_status_code, quantity, is_cod, received_at)
      VALUES ($1, $2, 'RECEIVED_AT_HUB', 1, false, NOW())
      ON CONFLICT (tracking_number) 
      DO UPDATE SET 
        package_status_code = 'RECEIVED_AT_HUB',
        hub_id = EXCLUDED.hub_id,
        received_at = NOW(),
        updated_at = NOW()
      RETURNING id;
    `;
    const pkgRes = await pool.query(upsertQuery, [trackingNumber, hubId]);
    packageId = pkgRes.rows[0].id;

    // 3. Proses File Upload Lagsung ke Neo Object Storage (S3)
    if (file && file.size > 0) {
      
      const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
      const safeRegNum = trackingNumber.replace(/[^a-zA-Z0-9]/g, '');
      const s3Key = `warekcargo/hubs/${hubCode}/${safeRegNum}_${Date.now()}${fileExtension}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      // Kirim via Jaringan Darat (API Put)
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.NEO_BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type || 'image/jpeg',
        ACL: 'public-read' // Agar fotonya bisa ditampilkan ke Admin/Nala nanti
      }));

      // Neo public URL pattern: https://nos.jkt-1.neo.id/aquvit-app/...
      const neoEndpoint = process.env.NEO_ENDPOINT?.replace(/\/$/, '');
      const dbFilePath = `${neoEndpoint}/${process.env.NEO_BUCKET_NAME}/${s3Key}`;

      // 4. Catat URL Publik Neo tersebut ke tabel package_photos
      await pool.query(
        `INSERT INTO package_photos (inbound_package_id, photo_type_code, file_path, original_filename, uploaded_by) 
         VALUES ($1, 'PACKAGE', $2, $3, 'Admin Hub')`,
         [packageId, dbFilePath, file.name]
      );
    }

    revalidatePath('/');
    return { success: true, message: 'Paket berhasil dicatat di Gudang!' };

  } catch (error: any) {
    console.error('Insert error:', error);
    return { success: false, message: error.message || 'Gagal menyimpan data ke database.' };
  }
}
