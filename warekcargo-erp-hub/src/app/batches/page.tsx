import pool from '@/lib/db';
import { submitBatch } from './actions';

export const revalidate = 0;

export default async function BatchesPage() {
   let batches = [];
   let dbError: string | null = null;
   
   try {
     const res = await pool.query(`SELECT id, batch_code as batch_number, service_type_code, transport_mode_code as transport_mode, batch_status_code as status, closing_at, created_at FROM shipping_batches ORDER BY created_at DESC LIMIT 20`);
     batches = res.rows;
   } catch(e: any) {
     dbError = e.message || "Gagal terkoneksi ke Sistem Pangkalan Database.";
   }

   return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            🚢 Modul Armada Kapal
          </h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Pusat pengendali navigasi (*Voyage*) penjadwalan ekspedisi rute Nabire.</p>
      </div>

      {dbError && (
         <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center justify-between text-red-700 shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
               <span className="text-3xl">📡</span>
               <div>
                 <h4 className="font-bold tracking-tight">Koneksi Pangkalan Terputus</h4>
                 <p className="text-sm font-medium mt-1">Kode: {dbError}</p>
               </div>
            </div>
         </div>
      )}

      {/* CREATE FORM CARD */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
         <h3 className="font-bold text-lg mb-6 text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
            Buka Tiket Pelayaran Baru
         </h3>
         
         <form action={submitBatch} className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Kode Kapal / Voyage Ke</label>
              <input type="text" name="batch_number" required placeholder="Contoh: KM Gunung Dempo Voy 3.5" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Klasifikasi Muatan</label>
              <select name="transport_mode" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
                <option value="KAPAL_KARGO">Truk / Kapal Kargo Roro</option>
                <option value="KAPAL_PENUMPANG">Kapal Penumpang Pelni</option>
                <option value="PESAWAT">Ekspedisi Udara Pesawat</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Batas Terima / Closing</label>
              <input type="datetime-local" name="closing_at" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
            </div>
            <div className="md:col-span-4 flex justify-end mt-4">
              <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 w-full md:w-auto justify-center">
                 🚀 Publikasi Jadwal
              </button>
            </div>
         </form>
      </div>
      
      {/* HISTORY TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 tracking-wide text-sm">Monitoring Jadwal Tunda & Berangkat</h3>
              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-slate-500 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest bg-white">
                 <tr>
                   <th className="p-5">Kode Sandar Kapal</th>
                   <th className="p-5">Sistem Operasi</th>
                   <th className="p-5">Deadline Penerimaan Logistik</th>
                   <th className="p-5">Status Kunci Gerbang</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {batches.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-bold text-slate-800">{b.batch_number}</td>
                    <td className="p-5">
                       <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                         {b.transport_mode}
                       </span>
                    </td>
                    <td className="p-5 text-slate-600 font-medium">
                       {b.closing_at ? new Date(b.closing_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : 'Menunggu Jadwal'}
                    </td>
                    <td className="p-5">
                       <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-[11px] font-bold border border-slate-200">
                         {b.status}
                       </span>
                    </td>
                  </tr>
                ))}
                
                {batches.length === 0 && (
                  <tr>
                     <td colSpan={4} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-4xl opacity-50 grayscale">🌊</span>
                          <span className="text-slate-500 font-bold tracking-widest uppercase text-xs">Belum ada jadwal kapal yang diberangkatkan.</span>
                        </div>
                     </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
   )
}
