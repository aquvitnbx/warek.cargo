import { Pool } from 'pg';

let pgPool: any = null;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ [WarekCargo DB] DATABASE_URL tidak ditemukan di .env.local.");
} else {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000, // Timeout 3 detik agar app tidak hang jika Postgres mati
    });

    pgPool.on('error', (err: any) => {
      console.error('🚨 [WarekCargo DB] Error pada koneksi idle:', err.message);
    });
  } catch (err: any) {
    console.error("🚨 [WarekCargo DB] Gagal inisialisasi koneksi:", err.message);
  }
}

// Wrapper Cerdas Koneksi Re-throw
const db = {
  query: async (text: string, params?: any[]) => {
    try {
      if (!pgPool) throw new Error("pgPool tidak terinisiasi. Periksa ENV.");
      return await pgPool.query(text, params);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        // Jangan penuhi log terminal dengan query panjang, cukup beri peringatan sekali
        console.warn(`⚠️ [WarekCargo DB]: ${error.message} (Tunnel offline?)`);
      } else {
        console.error(`❌ [WarekCargo DB]: ${error.message}`);
      }
      throw new Error(error.message); // Kembalikan ke Component agar UI bisa merender Alert
    }
  }
};

export default db;
