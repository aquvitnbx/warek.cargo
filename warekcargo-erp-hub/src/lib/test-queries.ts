import db from './db';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  console.log("=== Menguji Koneksi ke VPS ===");
  try {
    const todayQuery = await db.query(`SELECT COUNT(*) as count FROM inbound_packages WHERE DATE(received_at) = CURRENT_DATE`);
    console.log("Q1 OK:", todayQuery.rows);

    const activeBatchesQuery = await db.query(`SELECT COUNT(*) as count FROM shipping_batches WHERE batch_status_code IN ('PLANNED', 'OPEN')`);
    console.log("Q2 OK:", activeBatchesQuery.rows);

    const batchList = await db.query(`SELECT id, batch_code as batch_number, service_type_code, transport_mode_code as transport_mode, batch_status_code as status, closing_at, created_at FROM shipping_batches ORDER BY created_at DESC LIMIT 20`);
    console.log("Q3 OK:", batchList.rows);
  } catch(e) {
    console.log("BENCANA:", e);
  }
}
run();
