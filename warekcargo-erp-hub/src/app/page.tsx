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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Nexus</span></h2>
          <p className="text-slate-400 mt-2 text-sm md:text-base font-medium">Sistem pemantauan orbit kargo WarekCargo (Internal Only).</p>
        </div>
        <div className="hidden md:flex items-center gap-3 glass-card px-5 py-2.5 rounded-full">
           <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"></div>
           <span className="text-sm font-bold text-cyan-100 tracking-wider">LIVE TELEMETRY</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {/* Metric Card 1 */}
        <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-500/30 transition-colors"></div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] relative z-10 flex items-center gap-2">
             <span className="text-cyan-400">⚡</span> Masuk Hari Ini
          </span>
          <span className="text-6xl font-black text-white mt-4 relative z-10 group-hover:scale-105 transition-transform origin-left">{totalToday}</span>
        </div>

        {/* Metric Card 2 */}
        <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] relative z-10 flex items-center gap-2">
             <span className="text-emerald-400">📦</span> Tertahan di Hub
          </span>
          <span className="text-6xl font-black text-white mt-4 relative z-10 group-hover:scale-105 transition-transform origin-left">{packagesAtHub}</span>
        </div>

        {/* Metric Card 3 */}
        <div className="glass-card p-6 md:p-8 rounded-3xl flex flex-col relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-colors"></div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] relative z-10 flex items-center gap-2">
             <span className="text-indigo-400">🚢</span> Voyage Aktif
          </span>
          <span className="text-6xl font-black text-white mt-4 relative z-10 group-hover:scale-105 transition-transform origin-left">{activeBatches}</span>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden mt-8 border border-white/10 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 opacity-50"></div>
        <div className="p-6 md:p-8">
           <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-widest text-sm flex items-center gap-3 opacity-90">
              <span className="w-6 h-[1px] bg-cyan-400/50"></span> Quick Launch
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <Link href="/intake" className="glass-card group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl hover:border-cyan-500/50 transition-all cursor-pointer">
                 <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors shadow-[0_0_15px_rgba(6,182,212,0)] group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                   <span className="text-2xl group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">➕</span>
                 </div>
                 <span className="font-bold text-xs md:text-sm text-center text-slate-300 group-hover:text-white uppercase tracking-wider">Terima<br/>Scanner</span>
              </Link>
              
              <Link href="/packages" className="glass-card group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl hover:border-indigo-500/50 transition-all cursor-pointer">
                 <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors shadow-[0_0_15px_rgba(99,102,241,0)] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                   <span className="text-2xl group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]">📦</span>
                 </div>
                 <span className="font-bold text-xs md:text-sm text-center text-slate-300 group-hover:text-white uppercase tracking-wider">Data<br/>Manifest</span>
              </Link>
              
              <Link href="/batches" className="glass-card group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer">
                 <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors shadow-[0_0_15px_rgba(16,185,129,0)] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                   <span className="text-2xl group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">🚢</span>
                 </div>
                 <span className="font-bold text-xs md:text-sm text-center text-slate-300 group-hover:text-white uppercase tracking-wider">Armada<br/>Kapal</span>
              </Link>

              <div className="glass-card opacity-40 group flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl cursor-not-allowed border-transparent">
                 <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700">
                   <span className="text-2xl grayscale opacity-50">🔒</span>
                 </div>
                 <span className="font-bold text-xs md:text-sm text-center text-slate-500 uppercase tracking-wider">Accounting<br/>(Coming Soon)</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
