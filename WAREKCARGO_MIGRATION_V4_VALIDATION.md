# WAREKCARGO_MIGRATION_V4_VALIDATION.md

Dokumen ini adalah jalur aman untuk validasi `migration_to_schema_v4.sql` ke DB staging/snapshot.

## Prinsip
- validasi dilakukan ke **staging/snapshot**, bukan DB aktif
- script berjalan dalam transaksi lalu **ROLLBACK**
- tujuan utamanya memastikan migration bisa dieksekusi dan objek v4 utama benar-benar muncul

## Script
Lokasi script:
- `warekcargo-erp-hub/scripts/validate-migration-v4.mjs`

## Env yang dipakai
Prioritas env:
1. `MIGRATION_DATABASE_URL`
2. `STAGING_DATABASE_URL`
3. `DATABASE_URL`

Gunakan URL staging/snapshot secara eksplisit supaya tidak salah target.

## Cara jalan
Dari folder `warekcargo-erp-hub`:

```bash
MIGRATION_DATABASE_URL='postgres://user:pass@host:5432/dbname' \
npm run validate:migration:v4
```

## Yang divalidasi
- tabel `employees`
- tabel `batch_containers`
- kolom `customer_shipments.batch_container_id`
- status `AWAITING_HUB_RECEIPT`
- status `MANIFESTED`
- status payment `REFUND_PENDING`
- status payment `VOIDED`
- constraint `notifications_log` sudah mengizinkan `SKIPPED`

## Catatan
Batch ini baru menyiapkan validator dan jalur eksekusinya.
Eksekusi ke DB staging/snapshot masih menunggu target DB yang memang aman dipakai uji.
