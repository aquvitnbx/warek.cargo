import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function TrackingTimelinePage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params;
  const shipmentCode = decodeURIComponent(resolvedParams.code);
  
  let shipment: any = null;
  let history: any[] = [];
  let dbError = null;

  try {
     const resShp = await pool.query(`
        SELECT 
           s.*, 
           c.full_name, c.whatsapp_number, c.destination_city,
           b.batch_code, b.vessel_name, b.etd_at
        FROM customer_shipments s
        JOIN customers c ON s.customer_id = c.id
        LEFT JOIN shipping_batches b ON s.batch_id = b.id
        WHERE s.shipment_code = $1
     `, [shipmentCode]);
     shipment = resShp.rows[0];

     if (shipment) {
       // Fetch Timeline History
       const resHist = await pool.query(`
          SELECT *
          FROM shipment_status_history
          WHERE shipment_id = $1
          ORDER BY changed_at DESC
       `, [shipment.id]);
       history = resHist.rows;
     }
  } catch (err: any) {
     dbError = err.message || "Gagal terkoneksi ke Database.";
  }

  if (!shipment && !dbError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
         <h2 className="text-2xl font-black text-slate-800">Resi Tidak Ditemukan</h2>
         <p className="text-slate-500 mt-2">Nomor pelacakan <b>{shipmentCode}</b> tidak terdaftar di sistem kami.</p>
         <Link href="/tracking" className="px-6 py-3 mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">Telusuri Kode Lain</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
       <div>
          <Link href="/tracking" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Pusat Radar
          </Link>
          <div className="flex justify-between items-start mt-2">
             <h2 className="text-3xl md:text-3xl font-black tracking-tight text-slate-800 flex flex-col gap-1">
                Laporan Perjalanan
                <span className="font-mono text-xl text-blue-600 bg-blue-50 w-fit px-3 py-1 rounded">{shipmentCode}</span>
             </h2>
          </div>
       </div>

       {dbError && (
         <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold shadow-sm">
            🚨 Koneksi Error: {dbError}
         </div>
       )}

       {!dbError && (
          <>
          {/* IDENTITAS KUNCI (RELATIONAL VIEW) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                 <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Penerima</span>
                 <p className="font-black text-slate-800 truncate text-sm mt-1">{shipment.full_name}</p>
                 <p className="font-medium text-slate-500 text-xs truncate mt-0.5">{shipment.destination_city}</p>
             </div>
             <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                 <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Fisik Karung</span>
                 <p className="font-black text-slate-800 truncate text-sm mt-1">{shipment.total_weight_kg || 0} kg</p>
                 <p className="font-medium text-slate-500 text-xs truncate mt-0.5">{shipment.total_volume_m3 || 0} m³</p>
             </div>
             <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                 <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Keuangan</span>
                 <p className={`font-black truncate text-sm mt-1 uppercase ${shipment.payment_status_code === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>{shipment.payment_status_code}</p>
                 <p className="font-medium text-slate-500 text-[10px] truncate mt-0.5">Sudah lunas/terbayar</p>
             </div>
             <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                 <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Jadwal Kapal</span>
                 <p className="font-black text-slate-800 truncate text-sm mt-1">{shipment.vessel_name || 'TBA'}</p>
                 <p className="font-medium text-blue-500 text-xs truncate mt-0.5 font-mono">{shipment.batch_code || '-'}</p>
             </div>
          </div>

          {/* TIMELINE UI */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mt-6 relative">
             <h3 className="font-black text-slate-800 text-sm tracking-wide border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
                <span>⏱️ RIWAYAT PERJALANAN (TIMELINE)</span>
             </h3>

             <div className="relative border-l-2 border-slate-100 ml-4 md:ml-6 space-y-8 pb-4">
                
                {/* Node Paling Atas (Current Status Virtual) */}
                <div className="relative pl-8">
                   <div className="absolute w-6 h-6 rounded-full bg-blue-500 border-4 border-blue-100 -left-[13px] top-1 shadow-sm"></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mb-1">Status Terkini (Hari Ini)</span>
                      <h4 className="text-xl font-black text-blue-900 leading-tight uppercase tracking-wide">
                        {shipment.shipment_status_code}
                      </h4>
                      <p className="text-sm font-medium text-slate-500 mt-1">Sistem saat ini mencatat karung berada di fase <b>{shipment.shipment_status_code}</b>.</p>
                   </div>
                </div>

                {history.map((hist, idx) => {
                   const dateObj = new Date(hist.changed_at);
                   
                   return (
                      <div key={hist.id} className="relative pl-8 group">
                         <div className="absolute w-4 h-4 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-400 transition-colors -left-[9px] top-1"></div>
                         
                         <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-400 mb-1">
                               {dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} 
                               <span className="mx-2 text-slate-300">|</span> 
                               {dateObj.toLocaleTimeString('id-ID', { timeStyle: 'short' })}
                            </span>
                            
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-2 shadow-sm group-hover:shadow group-hover:border-blue-100 transition-all">
                               <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                  {hist.from_status_code}
                                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                  </svg>
                                  <span className="text-blue-700">{hist.to_status_code}</span>
                               </h4>
                               
                               {(hist.change_notes || hist.changed_source) && (
                                  <p className="text-xs text-slate-600 mt-2 font-medium">
                                     {hist.change_notes} <span className="italic text-slate-400 ml-1">({hist.changed_source})</span>
                                  </p>
                               )}
                            </div>
                         </div>
                      </div>
                   );
                })}

                {/* Node Paling Bawah (Genesis / Lahir) */}
                <div className="relative pl-8 pt-4">
                   <div className="absolute w-4 h-4 rounded-full bg-slate-300 border-2 border-white -left-[9px] top-5 shadow-sm"></div>
                   <div className="flex flex-col opacity-60">
                      <span className="text-[11px] font-bold text-slate-400 mb-1">
                         {new Date(shipment.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short'})}
                      </span>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                        RESI TERCETAK (Sistem Aktif)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">Dokumen elektronik pertama kali digenerate oleh sistem database.</p>
                   </div>
                </div>

             </div>
          </div>
          </>
       )}
    </div>
  )
}
