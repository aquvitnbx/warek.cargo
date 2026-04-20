import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function BatchesDashboard() {
  let batches = [];
  let dbError = null;

  try {
    const query = `
      SELECT 
         b.*, 
         h.name as hub_name,
         (SELECT count(*) FROM customer_shipments cs WHERE cs.batch_id = b.id) as assigned_shipments
      FROM shipping_batches b
      LEFT JOIN hubs h ON b.hub_id = h.id
      ORDER BY b.etd_at ASC
    `;
    const res = await pool.query(query);
    batches = res.rows;
  } catch (err: any) {
    dbError = err.message || "Gagal terkoneksi ke Database.";
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
               🚢 Jadwal Kapal & Manifest
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Buat rencana pelayaran dan masukkan karung-karung siap kirim ke dalam kontainer kapal.</p>
         </div>
         <Link href="/batches/new" className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all whitespace-nowrap text-sm text-center">
            + Buka Rencana Kapal Baru
         </Link>
      </div>

      {dbError && (
         <div className="bg-red-50 border border-red-200 p-5 rounded-2xl text-red-700 shadow-sm text-sm font-bold">
            Data gagal diambil: {dbError}
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((batch: any) => {
          const isActive = !['ARRIVED', 'CANCELLED'].includes(batch.batch_status_code);
          return (
          <Link href={`/batches/${batch.id}`} key={batch.id} className="block group">
             <div className={`bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-full flex flex-col relative overflow-hidden ${!isActive && 'opacity-60 grayscale'}`}>
                
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-800 border border-slate-200 text-xs font-black tracking-widest rounded-full uppercase">
                    {batch.batch_status_code}
                  </span>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-widest">{batch.transport_mode_code}</span>
                </div>

                <div className="flex-1">
                   <h3 className="font-black text-xl text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                     {batch.vessel_name || 'TBA'} {batch.voyage_number ? `(${batch.voyage_number})` : ''}
                   </h3>
                   <div className="space-y-1 mb-4">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">ETD (Berangkat)</p>
                      <p className="text-sm font-mono font-bold text-slate-700 bg-slate-50 border border-slate-100 inline-block px-2 py-1 rounded">
                         {new Date(batch.etd_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Muatan</span>
                      <span className="text-sm font-black text-slate-800">{batch.assigned_shipments} Karung</span>
                   </div>
                   <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                   </div>
                </div>

             </div>
          </Link>
        )})}

        {batches.length === 0 && !dbError && (
          <div className="col-span-full bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
             <span className="text-5xl opacity-30 grayscale mb-4">⚓</span>
             <h3 className="text-slate-500 font-black tracking-widest uppercase text-sm">Tidak Ada Jadwal Kapal</h3>
             <p className="text-slate-400 mt-2 text-sm max-w-md">Belum ada perencanaan pelayaran yang dibuat. Silakan tambahkan jadwal kapal untuk melengkapi rantai logistik karung Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
