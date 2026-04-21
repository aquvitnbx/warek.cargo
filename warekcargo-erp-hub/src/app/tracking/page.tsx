import pool from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function TrackingDashboard({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
  const resolvedParams = await searchParams;
  const rawQuery = resolvedParams.query;
  const searchQuery = rawQuery ? rawQuery.trim().toUpperCase() : '';

  let dbError = null;
  let shipments = [];

  try {
     let sqlQuery = `
       SELECT 
          s.id,
          s.shipment_code,
          s.shipment_status_code,
          s.payment_status_code,
          s.updated_at,
          c.full_name,
          c.destination_city,
          b.batch_code,
          b.vessel_name
       FROM customer_shipments s
       JOIN customers c ON s.customer_id = c.id
       LEFT JOIN shipping_batches b ON s.batch_id = b.id
     `;

     const params = [];
     if (searchQuery) {
        sqlQuery += ` WHERE s.shipment_code ILIKE $1 OR c.full_name ILIKE $1 OR c.customer_code ILIKE $1 `;
        params.push(`%${searchQuery}%`);
     }

     sqlQuery += ` ORDER BY s.updated_at DESC LIMIT 30 `;

     const res = await pool.query(sqlQuery, params);
     shipments = res.rows;
  } catch (err: any) {
     dbError = err.message;
  }

  // Handling search form submittion locally
  async function handleSearch(formData: FormData) {
    'use server';
    const q = formData.get('query');
    if (q) redirect(`/tracking?query=${encodeURIComponent(q.toString())}`);
    else redirect('/tracking');
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
               📡 Monitor Pergerakan
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Lacak rantai perjalanan setiap karung dari pintu gudang hingga tujuan akhir.</p>
         </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-lg relative overflow-hidden">
         <div className="absolute right-0 top-0 opacity-10">
            <span className="text-9xl">🔎</span>
         </div>
         <form action={handleSearch} className="relative z-10 max-w-2xl">
            <label className="block text-slate-300 font-bold uppercase tracking-widest text-xs mb-2">Lacak Cepat</label>
            <div className="flex gap-2">
               <input 
                  type="text" 
                  name="query" 
                  defaultValue={searchQuery}
                  placeholder="Masukkan Nomor Karung / Nama Pelanggan..." 
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
               />
               <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                  CARI
               </button>
               {searchQuery && (
                  <Link href="/tracking" className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors">
                     RESET
                  </Link>
               )}
            </div>
         </form>
      </div>

      {dbError && (
         <div className="bg-red-50 border border-red-200 p-5 rounded-2xl text-red-700 shadow-sm text-sm font-bold">
            Data gagal diambil: {dbError}
         </div>
      )}

      {!dbError && (
         <div className="bg-white border rounded-2xl shadow-sm overflow-hidden mt-6">
           <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                <tr>
                   <th className="p-4">Kode Perjalanan</th>
                   <th className="p-4">Posisi Status Akhir</th>
                   <th className="p-4">Pembayaran</th>
                   <th className="p-4">Tujuan / Kapal Info</th>
                   <th className="p-4 text-right">Update Terakhir</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {shipments.map((shp: any) => {
                   let shipColor = "bg-slate-100 text-slate-600 border-slate-200";
                   if (['DISPATCHED', 'INTRA_TRANSIT'].includes(shp.shipment_status_code)) shipColor = "bg-blue-100 text-blue-800 border-blue-200";
                   if (['ARRIVED', 'RECEIVED'].includes(shp.shipment_status_code)) shipColor = "bg-emerald-100 text-emerald-800 border-emerald-200";

                   return (
                   <tr key={shp.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => {
                        // Normally handled via link, but we put it row level
                   }}>
                      <td className="p-4">
                         <div className="flex flex-col items-start gap-1">
                            <span className="font-mono font-black tracking-wide text-sm text-slate-700">{shp.shipment_code}</span>
                            <span className="text-[10px] font-bold text-slate-400 max-w-[150px] truncate">{shp.full_name}</span>
                         </div>
                      </td>
                      <td className="p-4">
                         <span className={`px-2 py-0.5 border text-[10px] font-black tracking-widest uppercase rounded shadow-sm ${shipColor}`}>
                            {shp.shipment_status_code}
                         </span>
                      </td>
                      <td className="p-4">
                          <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${shp.payment_status_code === 'PAID' ? 'bg-emerald-500' : shp.payment_status_code === 'PARTIAL' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                             <span className="text-xs font-bold text-slate-600">{shp.payment_status_code}</span>
                          </div>
                      </td>
                      <td className="p-4">
                         <div className="text-xs font-black text-slate-700">{shp.destination_city}</div>
                         <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                            🚢 {shp.vessel_name ? `${shp.vessel_name} (${shp.batch_code})` : 'Belum naik kapal'}
                         </div>
                      </td>
                      <td className="p-4 text-right">
                         <div className="text-xs font-bold text-slate-600 mb-1">{new Date(shp.updated_at).toLocaleDateString('id-ID')}</div>
                         <div className="text-[10px] text-slate-400">{new Date(shp.updated_at).toLocaleTimeString('id-ID', {timeStyle: 'short'})}</div>
                      </td>
                      <td className="p-4 text-right">
                         <Link href={`/tracking/${shp.shipment_code}`} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors border border-slate-200 shadow-sm inline-flex whitespace-nowrap">
                            Buka Historis ➔
                         </Link>
                      </td>
                   </tr>
                )})}
                {shipments.length === 0 && (
                   <tr>
                      <td colSpan={6} className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                         {searchQuery ? `Kode rahasia tidak ditemukan` : `Belum ada riwayat pergerakan gudang`}
                      </td>
                   </tr>
                )}
             </tbody>
           </table>
         </div>
      )}
    </div>
  );
}
