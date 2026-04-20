import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0; // Disable static caching

export default async function DashboardOwner() {
  let totalToday = 0;
  let activeBatches = 0;
  let packagesAtHub = 0;
  
  try {
    const todayQuery = await pool.query(`SELECT COUNT(*) as count FROM inbound_packages WHERE DATE(received_at) = CURRENT_DATE`);
    totalToday = parseInt(todayQuery.rows[0].count);

    const activeBatchesQuery = await pool.query(`SELECT COUNT(*) as count FROM shipping_batches WHERE status IN ('planned', 'open')`);
    activeBatches = parseInt(activeBatchesQuery.rows[0].count);

    const hubPackagesQuery = await pool.query(`SELECT COUNT(*) as count FROM inbound_packages WHERE package_status_code = 'RECEIVED_AT_HUB'`);
    packagesAtHub = parseInt(hubPackagesQuery.rows[0].count);
  } catch (error) {
    console.error("Home metrics error:", error);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Ringkasan Hari Ini</h2>
        <p className="text-slate-500 mt-2 text-sm md:text-base">Mata rajawali untuk memantau pergerakan gudang WarekCargo Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {/* Metric Card 1 */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col hover:-translate-y-1 transition-transform relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Total Paket Masuk</span>
          <span className="text-5xl font-black text-blue-600 mt-3 relative z-10">{totalToday}</span>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col hover:-translate-y-1 transition-transform relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Timbunan di Hub</span>
          <span className="text-5xl font-black text-emerald-500 mt-3 relative z-10">{packagesAtHub}</span>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col hover:-translate-y-1 transition-transform relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full opacity-50"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Jadwal Kapal Aktif</span>
          <span className="text-5xl font-black text-amber-500 mt-3 relative z-10">{activeBatches}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mt-6">
        <div className="p-6 md:p-8">
           <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between">
              Akses Cepat Modul ⚡
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/intake" className="group flex flex-col items-center justify-center p-6 md:p-8 bg-slate-50 hover:bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl hover:text-blue-600 transition-all border border-slate-200/60 shadow-sm">
                 <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">➕</span>
                 <span className="font-bold text-xs md:text-sm text-center">Terima Barcode</span>
              </Link>
              <Link href="/packages" className="group flex flex-col items-center justify-center p-6 md:p-8 bg-slate-50 hover:bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl hover:text-purple-600 transition-all border border-slate-200/60 shadow-sm">
                 <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">📦</span>
                 <span className="font-bold text-xs md:text-sm text-center">Daftar Manifest</span>
              </Link>
              <Link href="/batches" className="group flex flex-col items-center justify-center p-6 md:p-8 bg-slate-50 hover:bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl hover:text-emerald-600 transition-all border border-slate-200/60 shadow-sm">
                 <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">🚢</span>
                 <span className="font-bold text-xs md:text-sm text-center">Jadwal Kapal</span>
              </Link>
              <div className="group flex flex-col items-center justify-center p-6 md:p-8 bg-slate-50/50 rounded-2xl text-slate-400 border border-slate-200/60 shadow-sm cursor-not-allowed opacity-60">
                 <span className="text-3xl mb-3 grayscale">📊</span>
                 <span className="font-bold text-xs md:text-sm text-center">Laporan Keuangan</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
