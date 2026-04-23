const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgres://warekcargo_app:Sukses%40123@127.0.0.1:5432/warekcargo_db"
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log("Inserting AWAITING_HUB_RECEIPT to ref_package_statuses...");
    await client.query(`
        INSERT INTO ref_package_statuses (code, name, description, sort_order) 
        VALUES ('AWAITING_HUB_RECEIPT', 'Data Telah Diterima, Menunggu Fisik Tiba', 'Pre-manifest declaration dari kustomer, fisik belum tiba di hub', 15)
        ON CONFLICT (code) DO NOTHING;
    `);

    console.log("Backfilling inbound_package_status_history...");
    const resHistory = await client.query(`
        UPDATE inbound_package_status_history
        SET to_status_code = 'AWAITING_HUB_RECEIPT'
        WHERE to_status_code = 'RECEIVED_AT_HUB'
          AND changed_source = 'NALA_BOT'
          AND change_notes ILIKE '%WhatsApp Nala Bot%';
    `);
    console.log(`Updated ${resHistory.rowCount} history records.`);

    console.log("Backfilling inbound_packages...");
    const resPackages = await client.query(`
        UPDATE inbound_packages p
        SET package_status_code = 'AWAITING_HUB_RECEIPT'
        WHERE package_status_code = 'RECEIVED_AT_HUB'
          AND received_at IS NULL
          AND EXISTS (
              SELECT 1 
              FROM inbound_package_status_history h 
              WHERE h.inbound_package_id = p.id 
                AND h.changed_source = 'NALA_BOT'
          )
          AND NOT EXISTS (
              SELECT 1
              FROM inbound_package_status_history h2
              WHERE h2.inbound_package_id = p.id
                AND h2.changed_source != 'NALA_BOT'
          );
    `);
    console.log(`Updated ${resPackages.rowCount} packages.`);

    await client.query('COMMIT');
    console.log("Migration successful.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
