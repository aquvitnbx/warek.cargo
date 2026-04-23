import pool from '@/lib/db';
import Link from 'next/link';
import BatchStatusButtons from '@/components/manifests/BatchStatusButtons';

export const revalidate = 0;

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
   const { id } = await params;
   let batch = null;
   let shipments = [];
   
   try {
       const res = await pool.query(`
          SELECT b.*, h.code as hub_code, h.name as hub_name
          FROM shipping_batches b
          LEFT JOIN hubs h ON b.hub_id = h.id
          WHERE b.id = $1
       `, [id]);
       if (res.rowCount > 0) batch = res.rows[0];

       // Query Containers that belong to this batch
       const cRes = await pool.query(`
          SELECT bc.id, bc.container_number, bc.container_type, bc.max_weight_kg,
                 COUNT(cs.id) as shipment_count,
                 COALESCE(SUM(cs.total_weight_kg), 0) as total_weight_kg
          FROM batch_containers bc
          LEFT JOIN customer_shipments cs ON bc.id = cs.batch_container_id
          WHERE bc.batch_id = $1
          GROUP BY bc.id
          ORDER BY bc.created_at ASC
       `, [id]);
       shipments = cRes.rows; // we re-use shipments variable to represent containers list for rendering simplicity

   } catch (err) {
       console.error("Batch Load Error:", err);
   }

   if (!batch) {
      return (
         <div className="text-center py-20">
            <h1 className="text-2xl font-bold">Jadwal Armada tidak ditemukan.</h1>
            <Link href="/manifests" className="text-blue-600 underline mt-2 block">Kembali ke Daftar Manifest</Link>
         </div>
      );
   }

   const isOpen = batch.batch_status_code === 'OPEN';
   const totalWeight = shipments.reduce((sum, s) => sum + (Number(s.total_weight_kg) || 0), 0);

   return (
      <div className="max-w-5xl mx-auto space-y-6 pt-4 animate-in fade-in pb-12 overflow-x-hidden">
         {/* HEADER */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <Link href="/manifests" className="text-slate-400 hover:text-blue-600 transition-colors">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                     </svg>
                  </Link>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight">MAN_ <span className="text-blue-600">{batch.batch_code}</span></h1>
               </div>
               <div className="flex items-center gap-3 ml-10">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded uppercase tracking-widest ${isOpen ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                     {batch.batch_status_code}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{batch.vessel_name} (VOY {batch.voyage_number || 'N/A'})</span>
               </div>
            </div>
            
            <BatchStatusButtons batchId={id} currentStatus={batch.batch_status_code} />
         </div>

         {/* SUMMARY INFO */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
               <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Rute</span>
               <div className="text-sm font-black text-slate-800">{batch.hub_code} ➔ {batch.destination_city}</div>
            </div>
            <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
               <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Keberangkatan (ETD)</span>
               <div className="text-sm font-black text-slate-800">{new Date(batch.etd_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
               <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Total Kontainer</span>
               <div className="text-2xl font-black text-blue-600 leading-none">{shipments.length} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Boks</span></div>
            </div>
            <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
               <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Muatan Tonnage</span>
               <div className="text-2xl font-black text-slate-800 leading-none">{totalWeight} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">KG</span></div>
            </div>
         </div>

         {/* CONTAINER LIST */}
         <div className="bg-white border text-sm border-slate-100 rounded-3xl shadow-sm overflow-hidden mt-8">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <h2 className="text-lg font-black text-slate-800">Daftar Referensi Muatan (Kontainer)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50/50">
               {shipments.map((c: any) => (
                  <Link href={`/manifests/${id}/container/${c.id}`} key={c.id} className="block hover:-translate-y-1 transition-transform">
                     <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-blue-300 hover:shadow-md cursor-pointer group">
                        <div className="flex justify-between items-start">
                           <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold tracking-widest rounded uppercase">
                              {c.container_type.replace('_', ' ')}
                           </span>
                           <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                           </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none truncate">{c.container_number}</h3>
                        <div className="flex items-center gap-4 mt-2">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Karung</p>
                              <p className="font-bold text-slate-700">{c.shipment_count} Koli</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tonnage</p>
                              <p className="font-bold text-slate-700">{c.total_weight_kg} Kg <span className="text-slate-400 font-medium text-xs">/ {c.max_weight_kg || '∞'}</span></p>
                           </div>
                        </div>
                     </div>
                  </Link>
               ))}

               {/* ADD CONTAINER CARD */}
               {isOpen && (
                  <form action={async (formData) => {
                     'use server';
                     const { createBatchContainer } = await import('@/app/manifests/actions');
                     await createBatchContainer(id, formData);
                  }} className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-5 flex flex-col justify-center gap-3 shadow-sm hover:border-blue-400 transition-colors">
                     <h3 className="text-sm font-bold text-blue-800 uppercase tracking-widest">Buka Akses Kontainer Baru</h3>
                     <input type="text" name="container_number" required placeholder="Cth: TEMU-99211" className="w-full p-3 font-bold text-sm bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                     <div className="flex gap-2">
                        <select name="container_type" className="flex-1 p-3 font-bold text-sm bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                           <option value="LCL">LCL Murni</option>
                           <option value="FCL_20FT">FCL 20FT</option>
                           <option value="UDARA_SMU">UDARA SMU</option>
                           <option value="DARAT_TRUCK">DARAT TRUCK</option>
                           <option value="LAINNYA">Lainnya...</option>
                        </select>
                        <select name="destination_city" className="flex-1 p-3 font-bold text-sm bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required>
                           <option value="">-- Tujuan --</option>
                           <option value="Nabire">Nabire</option>
                           <option value="Biak">Biak</option>
                           <option value="Serui">Serui</option>
                           <option value="Manokwari">Manokwari</option>
                           <option value="Sorong">Sorong</option>
                           <option value="Jayapura">Jayapura</option>
                           <option value="Fakfak">Fakfak</option>
                           <option value="Kaimana">Kaimana</option>
                        </select>
                        <button type="submit" className="w-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors">
                           <span className="font-bold text-xl">+</span>
                        </button>
                     </div>
                  </form>
               )}
            </div>

            {shipments.length === 0 && (
               <div className="p-10 text-center text-slate-400">
                  <div className="text-4xl mb-3 opacity-50">🏗️</div>
                  <span className="font-bold block text-slate-600">Jadwal armada ini belum memiliki entitas muatan (Kontainer/Truk/SMU).</span>
                  <p className="text-sm mt-1">Tambahkan ruang muatan agar karung konsumen dapat di-assign.</p>
               </div>
            )}
         </div>

      </div>
   );
}
