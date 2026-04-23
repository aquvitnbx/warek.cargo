import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function ContainerDetailPage({ params }: { params: { id: string, container_id: string } }) {
   const { id, container_id } = await params;
   let container = null;
   let batch = null;
   let shipments = [];
   
   try {
       const resContainer = await pool.query(`SELECT * FROM batch_containers WHERE id = $1`, [container_id]);
       if (resContainer.rowCount > 0) container = resContainer.rows[0];

       const resBatch = await pool.query(`SELECT * FROM shipping_batches WHERE id = $1`, [id]);
       if (resBatch.rowCount > 0) batch = resBatch.rows[0];

       if (container) {
          const sRes = await pool.query(`
             SELECT cs.id, cs.shipment_code, cs.total_weight_kg, cs.shipment_status_code, c.destination_city as shipment_city,
                    c.full_name as customer_name
             FROM customer_shipments cs
             LEFT JOIN customers c ON cs.customer_id = c.id
             WHERE cs.batch_container_id = $1
             ORDER BY cs.created_at ASC
          `, [container.id]);
          shipments = sRes.rows;
       }
   } catch (err) {
       console.error("Container Load Error:", err);
   }

   if (!container || !batch) {
      return (
         <div className="text-center py-20">
            <h1 className="text-2xl font-bold">Kontainer tidak ditemukan.</h1>
            <Link href={`/manifests/${id}`} className="text-blue-600 underline mt-2 block">Kembali ke Pelayaran</Link>
         </div>
      );
   }

   const totalWeight = shipments.reduce((sum, s) => sum + (Number(s.total_weight_kg) || 0), 0);

   return (
      <div className="max-w-5xl mx-auto space-y-6 pt-4 animate-in fade-in pb-12 overflow-x-hidden">
         {/* HEADER */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <Link href={`/manifests/${id}`} className="text-slate-400 hover:text-blue-600 transition-colors">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                     </svg>
                  </Link>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">KONT_ <span className="text-blue-600">{container.container_number}</span></h1>
               </div>
               <div className="flex items-center gap-3 ml-10">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-widest bg-slate-200 text-slate-700`}>
                     {container.container_type.replace('_', ' ')}
                  </span>
                  <span className={`px-2.5 py-1 text-[10px] font-black rounded uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200`}>
                     Tujuan: {container.destination_city}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                     Milik Jadwal: {batch.vessel_name} ({batch.batch_code})
                  </span>
               </div>
            </div>
         </div>

         {/* SUMMARY INFO */}
         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
               <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Total Karung Ter-Assign</span>
               <div className="text-2xl font-black text-blue-600 leading-none">{shipments.length} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Koli</span></div>
            </div>
            <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
               <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Tonnage Muatan</span>
               <div className="text-2xl font-black text-slate-800 leading-none">{totalWeight} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">KG</span></div>
            </div>
            {container.max_weight_kg && (
               <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Kapasitas Maksimal</span>
                  <div className="text-2xl font-black text-red-500 leading-none">{container.max_weight_kg} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">KG</span></div>
               </div>
            )}
         </div>

         {/* MANIFEST LIST */}
         <div className="bg-white border text-sm border-slate-100 rounded-3xl shadow-sm overflow-hidden mt-8">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <h2 className="text-lg font-black text-slate-800">Karung di dalam Kontainer ini</h2>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                     <tr>
                        <th className="p-4 pl-6">Kode Karung</th>
                        <th className="p-4">Pemilik</th>
                        <th className="p-4 text-right">Berat Asli</th>
                        <th className="p-4">Status Transisi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                     {shipments.map((s: any) => {
                        const isMismatch = container.destination_city && s.shipment_city && container.destination_city !== s.shipment_city;
                        
                        return (
                        <tr key={s.id} className={`${isMismatch ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50/50'} transition-colors`}>
                           <td className="p-4 pl-6 relative">
                              {isMismatch && (
                                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 animate-pulse"></div>
                              )}
                              <Link href={`/consolidation/${s.id}`} className={`font-bold ${isMismatch ? 'text-red-700' : 'text-blue-600'} hover:underline`}>
                                 {s.shipment_code}
                              </Link>
                              {isMismatch && (
                                 <div className="text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 mt-1 w-fit rounded uppercase tracking-widest shadow-sm">
                                    MISMATCH (Tujuan: {s.shipment_city})
                                 </div>
                              )}
                           </td>
                           <td className="p-4 text-slate-800 font-bold">{s.customer_name}</td>
                           <td className="p-4 text-right font-black text-slate-800">{s.total_weight_kg || 0} Kg</td>
                           <td className="p-4">
                              <span className="text-[10px] px-2 py-1 tracking-widest bg-slate-100 text-slate-600 rounded font-bold uppercase">{s.shipment_status_code}</span>
                           </td>
                        </tr>
                     )})}

                     {shipments.length === 0 && (
                        <tr>
                           <td colSpan={4} className="p-8 text-center text-slate-400">
                              <div className="text-3xl mb-2 opacity-50">📦</div>
                              <span className="font-bold block text-slate-600">Kontainer ini masih kosong.</span>
                              <p className="text-xs mt-1">Gunakan rute Konsolidasi untuk menautkan karung ke kontainer armada ini.</p>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

      </div>
   );
}
