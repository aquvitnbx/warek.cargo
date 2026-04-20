import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0; 

export default async function DashboardOwner() {
  let totalToday = 0;
  let activeBatches = 0;
  let packagesAtHub = 0;
  let recentActivities: any[] = [];
  let dbError: string | null = null;
  
  try {
    const todayQuery = await pool.query(`SELECT COUNT(*) as count FROM inbound_packages WHERE DATE(received_at) = CURRENT_DATE`);
    totalToday = parseInt(todayQuery.rows[0].count);

    const activeBatchesQuery = await pool.query(`SELECT COUNT(*) as count FROM shipping_batches WHERE batch_status_code IN ('PLANNED', 'OPEN')`);
    activeBatches = parseInt(activeBatchesQuery.rows[0].count);

    const hubPackagesQuery = await pool.query(`SELECT COUNT(*) as count FROM inbound_packages WHERE package_status_code = 'RECEIVED_AT_HUB'`);
    packagesAtHub = parseInt(hubPackagesQuery.rows[0].count);

    const activityQuery = await pool.query(`
       SELECT p.tracking_number, p.received_at, p.package_status_code, h.code as hub_code
       FROM inbound_packages p
       LEFT JOIN hubs h ON p.hub_id = h.id
       ORDER BY p.received_at DESC
       LIMIT 5
    `);
    recentActivities = activityQuery.rows;

  } catch (error: any) {
    dbError = error.message || "Gagal terkoneksi ke Sistem Pangkalan Database.";
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6 relative">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">Ringkasan Hari Ini</h2>
          <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide">Pantau pergerakan logistik dan armada aktif WarekCargo Hub.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white border border-slate-200 px-5 py-2.5 rounded-full shadow-sm">
           <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
           {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {dbError && (
         <div className="bg-red-50/50 backdrop-blur-md border border-red-200 p-5 rounded-2xl flex items-center justify-between text-red-700 shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-red-100 rounded-xl">
                 <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3.L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
               </div>
               <div>
                 <h4 className="font-bold tracking-tight text-lg">Koneksi Pangkalan Terputus</h4>
                 <p className="text-sm font-medium mt-0.5 opacity-80">Kode Kesalahan: {dbError}</p>
                 <p className="text-xs font-medium opacity-60 mt-1">Sistem lokal sedang berjalan dalam mode offline/fallback. Nyalakan SSH Tunnel.</p>
               </div>
            </div>
         </div>
      )}

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* KPI 1 */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] relative z-10 flex items-center gap-2.5">
             <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
             </div>
             Masuk Hari Ini
          </span>
          <div className="mt-8 flex items-end justify-between relative z-10">
            <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">{totalToday}</span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full uppercase tracking-wider">Paket</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] relative z-10 flex items-center gap-2.5">
             <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
             </div>
             Tertahan di Hub
          </span>
          <div className="mt-8 flex items-end justify-between relative z-10">
            <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">{packagesAtHub}</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full uppercase tracking-wider">Paket</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] relative z-10 flex items-center gap-2.5">
             <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
             Jadwal Aktif
          </span>
          <div className="mt-8 flex items-end justify-between relative z-10">
            <span className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">{activeBatches}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-wider">Armada</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        
        {/* QUICK ACCESS SECTION */}
        <div className="lg:col-span-2 space-y-5">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Pintasan Operasional</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* ACTION: INTAKE */}
              <Link href="/intake" className="group bg-white p-7 rounded-3xl shadow-sm hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] border border-slate-100 hover:border-blue-200 flex flex-col sm:flex-row gap-5 transition-all duration-300 outline-none focus:ring-4 focus:ring-blue-100 hover:-translate-y-1">
                 <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white duration-300 shadow-sm border border-blue-100 group-hover:border-transparent">
                   <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                   </svg>
                 </div>
                 <div className="flex flex-col justify-center">
                   <h4 className="font-black text-slate-800 text-lg group-hover:text-blue-700 transition-colors">Terima Scanner</h4>
                   <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed tracking-wide">Pindai resi logistik masuk, ambil foto bukti kondisional barang.</p>
                 </div>
              </Link>
              
              {/* ACTION: MANIFEST */}
              <Link href="/packages" className="group bg-white p-7 rounded-3xl shadow-sm hover:shadow-[0_8px_30px_rgb(16,185,129,0.15)] border border-slate-100 hover:border-emerald-200 flex flex-col sm:flex-row gap-5 transition-all duration-300 outline-none focus:ring-4 focus:ring-emerald-100 hover:-translate-y-1">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white duration-300 shadow-sm border border-emerald-100 group-hover:border-transparent">
                   <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                 </div>
                 <div className="flex flex-col justify-center">
                   <h4 className="font-black text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">Data Manifest</h4>
                   <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed tracking-wide">Pantau pergerakan antrean paket secara real-time di pangkalan.</p>
                 </div>
              </Link>
              
              {/* ACTION: BATCHES */}
              <Link href="/batches" className="group bg-white p-7 rounded-3xl shadow-sm hover:shadow-[0_8px_30px_rgb(99,102,241,0.15)] border border-slate-100 hover:border-indigo-200 flex flex-col sm:flex-row gap-5 transition-all duration-300 outline-none focus:ring-4 focus:ring-indigo-100 hover:-translate-y-1">
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white duration-300 shadow-sm border border-indigo-100 group-hover:border-transparent">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                 </div>
                 <div className="flex flex-col justify-center">
                   <h4 className="font-black text-slate-800 text-lg group-hover:text-indigo-700 transition-colors">Armada Kapal</h4>
                   <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed tracking-wide">Kendali operasi Voyage dan pembukaan gerbang logistik kapal.</p>
                 </div>
              </Link>

              {/* ACTION: DISABLED FINANCE */}
              <div className="bg-slate-50 p-7 rounded-3xl border border-slate-100 flex flex-col sm:flex-row gap-5 opacity-60 cursor-not-allowed">
                 <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                   <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                 </div>
                 <div className="flex flex-col justify-center">
                   <h4 className="font-black text-slate-600 text-lg">Laporan & Tagihan</h4>
                   <p className="text-xs text-slate-400 font-medium mt-1.5 leading-relaxed tracking-wide">Modul keuangan Hub masih digembok hingga otorisasi penuh.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* RECENT ACTIVITY POSTS */}
        <div className="space-y-5">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-between">
              <span>Log Aktivitas</span>
              <Link href="/packages" className="text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md transition-colors uppercase font-bold tracking-wider">Perbesar</Link>
           </h3>
           <div className="bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden relative">
              
              {recentActivities.length > 0 ? (
                 <div className="divide-y divide-slate-50">
                    {recentActivities.map((act) => (
                       <div key={act.tracking_number} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col gap-2 group cursor-pointer border-l-4 border-transparent hover:border-blue-500">
                          <div className="flex justify-between items-center">
                            <span className="font-mono font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">{act.tracking_number}</span>
                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded tracking-widest uppercase">
                               {act.hub_code || 'HUB'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-widest flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {act.package_status_code?.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold">
                               {new Date(act.received_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                       </div>
                    ))}
                 </div>
              ) : (
                 <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center p-5">
                       <svg className="w-full h-full text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                       </svg>
                    </div>
                    <div className="space-y-1">
                       <p className="text-sm font-bold text-slate-600">Belum Ada Aktivitas logistik.</p>
                       <p className="text-[11px] font-medium text-slate-400">Pindai resi pertama Anda di menu Terima.</p>
                    </div>
                 </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
