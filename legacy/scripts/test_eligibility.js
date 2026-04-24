const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgres://warekcargo_app:Sukses%40123@127.0.0.1:5432/warekcargo_db"
});

async function runTest() {
  const client = await pool.connect();
  const testResi = 'E2E-TEST-100';
  
  try {
    console.log(`[TEST 1] Mendaftarkan ${testResi} ke status AWAITING_HUB_RECEIPT (Pre-Manifest)...`);
    
    // Inject the exact AWAITING_HUB_RECEIPT package mimicking Nala
    await client.query(`
       INSERT INTO inbound_packages (
          package_ticket_code, hub_id, tracking_number,
          item_description, quantity, package_status_code,
          is_cod, customer_declared_at
       )
       VALUES (
          'PKG-E2E-TEST-100', (SELECT id FROM hubs WHERE code = 'JKT'), 'E2E-TEST-100',
          'Barang Uji Kelayakan Konsolidasi', 1, 'AWAITING_HUB_RECEIPT', false, NOW()
       )
       ON CONFLICT (tracking_number) DO UPDATE SET package_status_code = 'AWAITING_HUB_RECEIPT', received_at = NULL;
    `);
    
    // Check consolidation queue eligibility logic matching page.tsx
    const test1 = await client.query(`
      SELECT COUNT(*) as cnt FROM inbound_packages p
      LEFT JOIN shipment_packages sp ON p.id = sp.inbound_package_id
      WHERE sp.shipment_id IS NULL
        AND p.package_status_code IN ('RECEIVED_AT_HUB', 'REPACKING')
        AND p.tracking_number = '${testResi}'
    `);
    
    const countCheck1 = parseInt(test1.rows[0].cnt);
    if (countCheck1 === 0) {
       console.log(`✅ BERHASIL: ${testResi} tersembunyi dari Konsolidasi (Jumlah ditemukan di kueri konsolidasi: ${countCheck1})`);
    } else {
       console.log(`❌ GAGAL: ${testResi} tembus antrean Konsolidasi padahal Pre-Manifest!`);
       return;
    }

    console.log(`\n[TEST 2] Mensimulasikan resi ${testResi} discan Scanner Fisik (Diubah ke RECEIVED_AT_HUB & received_at diisi)...`);
    await client.query(`
       UPDATE inbound_packages 
       SET package_status_code = 'RECEIVED_AT_HUB', received_at = NOW() 
       WHERE tracking_number = '${testResi}'
    `);
    
    const test2 = await client.query(`
      SELECT COUNT(*) as cnt FROM inbound_packages p
      LEFT JOIN shipment_packages sp ON p.id = sp.inbound_package_id
      WHERE sp.shipment_id IS NULL
        AND p.package_status_code IN ('RECEIVED_AT_HUB', 'REPACKING')
        AND p.tracking_number = '${testResi}'
    `);
    
    const countCheck2 = parseInt(test2.rows[0].cnt);
    if (countCheck2 === 1) {
       console.log(`✅ BERHASIL: ${testResi} resmi terbuka kelayakannya dan Masuk Anggota Konsolidasi (Eligible Count: ${countCheck2})`);
    } else {
       console.log(`❌ GAGAL: ${testResi} masih tidak ditemukan pada Antrean setelah diterima Fisik.`);
    }

  } catch (err) {
    console.error("Test Error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

runTest();
