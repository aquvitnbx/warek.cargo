import pool from '@/lib/db';
import Link from 'next/link';
import IntakeForm from '@/components/IntakeForm';

export const revalidate = 0; 

export default async function IntakePage() {
  let hubs = [];
  let statuses = [];
  let recentPackages = [];
  let dbError = null;

  try {
    const hubsQuery = await pool.query("SELECT code, name FROM hubs WHERE is_active = true ORDER BY name");
    hubs = hubsQuery.rows;

    const statusesQuery = await pool.query("SELECT code, name FROM ref_package_statuses WHERE code IN ('RECEIVED_AT_HUB', 'DAMAGED', 'UNIDENTIFIED') ORDER BY sort_order");
    statuses = statusesQuery.rows;

    const recentQuery = await pool.query(`
      SELECT p.tracking_number, p.received_at, p.package_status_code, h.code as hub_code, p.item_description
      FROM inbound_packages p
      LEFT JOIN hubs h ON p.hub_id = h.id
      ORDER BY p.received_at DESC
      LIMIT 5
    `);
    recentPackages = recentQuery.rows;
  } catch(e: any) {
    dbError = e.message || "Gagal terkoneksi ke Database VPS.";
  }

  // Fallback defaults in case DB is down or empty
  if (hubs.length === 0 && !dbError) {
     hubs = [{ code: 'JKT', name: 'Hub Jakarta' }, { code: 'SUB', name: 'Hub Surabaya' }, { code: 'MKS', name: 'Hub Makassar' }];
  }
  if (statuses.length === 0 && !dbError) {
     statuses = [
       { code: 'RECEIVED_AT_HUB', name: 'Received at Hub' },
       { code: 'DAMAGED', name: 'Damaged' },
       { code: 'UNIDENTIFIED', name: 'Unidentified' }
     ];
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Link href="/" className="text-slate-400 hover:text-blue-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
             </Link>
             <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">Terima Scanner</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-9">Pindai resi masuk, tangkap gambar fisik barang, & log penerimaan gudang.</p>
        </div>
      </div>

      {dbError && (
         <div className="bg-red-50/50 backdrop-blur-md border border-red-200 p-5 rounded-2xl flex items-center justify-between text-red-700 shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
               <span className="text-3xl">📡</span>
               <div>
                 <h4 className="font-bold tracking-tight">Koneksi Pangkalan Terputus</h4>
                 <p className="text-sm font-medium mt-1">Kode: {dbError}</p>
                 <p className="text-xs mt-1 opacity-70">Aplikasi berjalan menggunakan mode Mock Fallback lokal.</p>
               </div>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* FORM INTAKE (Kiri) */}
        <div className="lg:col-span-3">
          <div className="bg-white p-7 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            
            <IntakeForm hubs={hubs} statuses={statuses} />

          </div>
        </div>

        {/* RIWAYAT (Kanan) */}
        <div className="lg:col-span-2 space-y-5">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center justify-between">
              <span>Paket Terbaru</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
           </h3>

           <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
              {recentPackages.length > 0 ? (
                 <div className="divide-y divide-slate-50/80">
                    {recentPackages.map((act: any) => (
                       <div key={act.tracking_number} className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col gap-2.5 group">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                               <span className="font-mono font-black text-sm text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-wider">{act.tracking_number}</span>
                               <span className="text-[11px] font-bold text-slate-400 mt-0.5">{act.item_description || 'Tanpa deskripsi'}</span>
                            </div>
                            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded tracking-widest uppercase">
                               {act.hub_code}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-1">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest flex items-center gap-1.5 ${
                               act.package_status_code === 'DAMAGED' ? 'text-red-700 bg-red-50 border-red-100' : 
                               act.package_status_code === 'UNIDENTIFIED' ? 'text-amber-700 bg-amber-50 border-amber-100' :
                               'text-emerald-700 bg-emerald-50 border-emerald-100'
                            }`}>
                               <span className={`w-1.5 h-1.5 rounded-full ${
                                  act.package_status_code === 'DAMAGED' ? 'bg-red-500' : 
                                  act.package_status_code === 'UNIDENTIFIED' ? 'bg-amber-500' :
                                  'bg-emerald-500'
                               }`}></span> 
                               {act.package_status_code?.replace(/_/g, ' ')}
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
                       <p className="text-sm font-bold text-slate-600">Terima Resi Pertama</p>
                       <p className="text-[11px] font-medium text-slate-400">Pindai barcode paket untuk memulai operasional hari ini.</p>
                    </div>
                 </div>
              )}
           </div>

        </div>

      </div>

    </div>
  );
}
