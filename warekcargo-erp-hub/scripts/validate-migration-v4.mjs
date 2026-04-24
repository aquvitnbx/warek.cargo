import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

(process.loadEnvFile)?.('.env.local');

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const migrationPath = path.join(rootDir, 'migration_to_schema_v4.sql');
const databaseUrl = process.env.MIGRATION_DATABASE_URL || process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Set MIGRATION_DATABASE_URL atau STAGING_DATABASE_URL terlebih dulu.');
  process.exit(1);
}

const validations = [
  {
    label: 'table employees tersedia',
    sql: `select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'employees'
    ) as ok;`,
  },
  {
    label: 'table batch_containers tersedia',
    sql: `select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'batch_containers'
    ) as ok;`,
  },
  {
    label: 'customer_shipments.batch_container_id tersedia',
    sql: `select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'customer_shipments' and column_name = 'batch_container_id'
    ) as ok;`,
  },
  {
    label: 'status package AWAITING_HUB_RECEIPT ada',
    sql: `select exists (
      select 1 from ref_package_statuses where code = 'AWAITING_HUB_RECEIPT'
    ) as ok;`,
  },
  {
    label: 'status shipment MANIFESTED ada',
    sql: `select exists (
      select 1 from ref_shipment_statuses where code = 'MANIFESTED'
    ) as ok;`,
  },
  {
    label: 'status payment REFUND_PENDING ada',
    sql: `select exists (
      select 1 from ref_payment_statuses where code = 'REFUND_PENDING'
    ) as ok;`,
  },
  {
    label: 'status payment VOIDED ada',
    sql: `select exists (
      select 1 from ref_payment_statuses where code = 'VOIDED'
    ) as ok;`,
  },
  {
    label: 'constraint notifications_log mengizinkan SKIPPED',
    sql: `select coalesce(pg_get_constraintdef(oid) ilike '%SKIPPED%', false) as ok
      from pg_constraint
      where conname = 'notifications_log_delivery_status_code_check'
      limit 1;`,
  },
];

const client = new Client({ connectionString: databaseUrl });
const migrationSql = await readFile(migrationPath, 'utf8');

try {
  await client.connect();
  await client.query('begin');
  await client.query(migrationSql);

  let failed = false;
  for (const check of validations) {
    const result = await client.query(check.sql);
    const ok = Boolean(result.rows[0]?.ok);
    console.log(`${ok ? '✅' : '❌'} ${check.label}`);
    if (!ok) failed = true;
  }

  await client.query('rollback');

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log('\nSemua validasi lulus. Migration tervalidasi dalam transaksi dan sudah di-ROLLBACK.');
  }
} catch (error) {
  try {
    await client.query('rollback');
  } catch {}
  console.error('\nValidasi migration gagal.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
