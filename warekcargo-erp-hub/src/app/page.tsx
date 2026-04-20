import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0; 

export default async function DashboardOwner() {
  let totalToday = 0;
  let activeBatches = 0;
  let packagesAtHub = 0;
  
  try {
    const todayQuery = await pool.query(`SELECT COUNT(*) as count FROM inbound_packages WHERE DATE(received_at) = CURRENT_DATE`);
    totalToday = parseInt(todayQuery.rows[0].count);

    const activeBatchesQuery = await pool.query(`SELECT COUNT(*) as count FROM shipping_batches WHERE batch_status_code IN ('PLANNED', 'OPEN')`);
    activeBatches = parseInt(activeBatchesQuery.rows[0].count);

    const hubPackagesQuery = await pool.query(`SELECT COUNT(*) as count FROM inbound_packages WHERE package_status_code = 'RECEIVED_AT_HUB'`);
    packagesAtHub = parseInt(hubPackagesQuery.rows[0].count);
  } catch (error) {
    console.error("Home metrics error:", error);
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Ringkasan Hari Ini</h2>
          <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">Pantau pergerakan gudang dan kapal aktif WarekCargo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {/* Metric Card 1 */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:border-blue-200 hover:-translate-y-1 transition-all">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             📦 Masuk Hari Ini
          </span>
          <span className="text-6xl font-black text-blue-600 mt-4">{totalToday}</span>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:border-amber-200 hover:-translate-y-1 transition-all">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             ⏳ Tertahan di Hub
          </span>
          <span className="text-6xl font-black text-amber-500 mt-4">{packagesAtHub}</span>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:border-emerald-200 hover:-translate-y-1 transition-all">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
             🚢 Jadwal Kapal Aktif
          </span>
          <span className="text-6xl font-black text-emerald-600 mt-4">{activeBatches}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden mt-8 shadow-sm border border-slate-100">
        <div className="p-6 md:p-8">
           <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider text-sm flex items-center gap-3">
              Akses Cepat Modul ERP
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <Link href="/intake" className="bg-slate-50 group flex flex-col items-center justify-center p-6 rounded-2xl hover:bg-blue-50 border border-slate-100 transition-colors cursor-pointer text-slate-600 hover:text-blue-700">
                 <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <span className="text-2xl">➕</span>
                 </div>
                 <span className="font-bold text-xs md:text-sm text-center uppercase tracking-wider">Terima<br/>Scanner</span>
              </Link>
              
              <Link href="/packages" className="bg-slate-50 group flex flex-col items-center justify-center p-6 rounded-2xl hover:bg-emerald-50 border border-slate-100 transition-colors cursor-pointer text-slate-600 hover:text-emerald-700">
                 <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <span className="text-2xl">📋</span>
                 </div>
                 <span className="font-bold text-xs md:text-sm text-center uppercase tracking-wider">Data<br/>Manifest</span>
              </Link>
              
              <Link href="/batches" className="bg-slate-50 group flex flex-col items-center justify-center p-6 rounded-2xl hover:bg-indigo-50 border border-slate-100 transition-colors cursor-pointer text-slate-600 hover:text-indigo-700">
                 <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                   <span className="text-2xl">🚢</span>
                 </div>
                 <span className="font-bold text-xs md:text-sm text-center uppercase tracking-wider">Armada<br/>Kapal</span>
              </Link>

              <div className="bg-slate-50 group flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-100 opacity-60 cursor-not-allowed">
                 <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                   <span className="text-2xl grayscale opacity-60">🔒</span>
                 </div>
                 <span className="font-bold text-xs md:text-sm text-center text-slate-400 uppercase tracking-wider">Laporan<br/>(Segera)</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
