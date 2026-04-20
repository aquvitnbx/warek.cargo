import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function RepackingDashboard() {
  let shipments = [];
  let dbError = null;

  try {
    const query = `
      SELECT 
        s.id as shipment_id,
        s.shipment_code,
        s.shipment_status_code,
        s.total_weight_kg,
        s.total_volume_m3,
        c.full_name,
        c.destination_city,
        (SELECT count(*) FROM shipment_packages sp WHERE sp.shipment_id = s.id) as package_count
      FROM customer_shipments s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.shipment_status_code IN ('DRAFT', 'AWAITING_PACKAGES', 'READY_FOR_DISPATCH')
      ORDER BY 
        CASE WHEN s.total_weight_kg IS NULL THEN 0 ELSE 1 END,
        s.created_at DESC
    `;
    const res = await pool.query(query);
    shipments = res.rows;
  } catch (err: any) {
    dbError = err.message || "Gagal terkoneksi ke sistem Database.";
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <Link href="/" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </Link>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
               ⚖️ Repacking Karung
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Validasi dimensi (Volume) dan timbang berat akhir sebelum manifest diserahkan ke Kapal.</p>
         </div>
      </div>

      {dbError && (
         <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center gap-4 text-red-700 shadow-sm">
            <span className="text-3xl">📡</span>
            <div>
              <h4 className="font-bold tracking-tight">Koneksi Error</h4>
              <p className="text-sm font-medium mt-1">{dbError}</p>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shipments.map((shp: any) => {
          const isFinished = shp.total_weight_kg > 0;
          
          return (
          <Link href={`/repacking/${shp.shipment_id}`} key={shp.shipment_id} className="block group">
             <div className={`border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between relative overflow-hidden ${
                 isFinished ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-400' : 'bg-white border-slate-200 hover:border-blue-300'
             }`}>
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-4">
                     <span className={`px-3 py-1 text-[10px] font-black tracking-widest rounded-full shadow-sm ${
                        isFinished ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                     }`}>
                       {shp.shipment_status_code}
                     </span>
                     <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{shp.destination_city}</span>
                   </div>
                   <h3 className="font-black text-xl text-slate-800 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                     {shp.full_name}
                   </h3>
                   <p className="text-slate-500 font-mono font-bold text-sm bg-slate-100 px-2 py-0.5 rounded inline-block">{shp.shipment_code}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Detail Karung</span>
                      <span className="text-xs font-bold text-slate-600 mt-1">
                         {shp.package_count} Paket | {isFinished ? `${shp.total_weight_kg}kg (${shp.total_volume_m3}m³)` : 'Belum Ditimbang'}
                      </span>
                   </div>
                   
                   <div className={`p-2 rounded-xl transition-colors ${isFinished ? 'bg-emerald-100 group-hover:bg-emerald-200' : 'bg-blue-50 group-hover:bg-blue-100'}`}>
                      <svg className={`w-5 h-5 ${isFinished ? 'text-emerald-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                         {isFinished ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                         ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                         )}
                      </svg>
                   </div>
                </div>
             </div>
          </Link>
        )})}

        {shipments.length === 0 && !dbError && (
          <div className="col-span-full bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
             <span className="text-5xl opacity-30 grayscale mb-4">🧹</span>
             <h3 className="text-slate-500 font-black tracking-widest uppercase text-sm">Gudang Repacking Kosong</h3>
             <p className="text-slate-400 mt-2 text-sm max-w-md">Belum ada karung Konsolidasi baru yang perlu ditimbang/diukur volumenya.</p>
          </div>
        )}
      </div>

    </div>
  );
}
