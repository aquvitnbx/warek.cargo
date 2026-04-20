import pool from '@/lib/db';
import { submitBatch } from './actions';

export const revalidate = 0;

export default async function BatchesPage() {
   let batches = [];
   try {
     const res = await pool.query(`SELECT id, batch_number, service_type_code, transport_mode, status, closing_at, created_at FROM shipping_batches ORDER BY created_at DESC LIMIT 20`);
     batches = res.rows;
   } catch(e) {
     console.error("Fetch batches err: ", e);
   }

   return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Manajemen Pelayaran</h2>
          <p className="text-slate-500 mt-2 text-sm">Gunakan form ini untuk membuka pendaftaran angkut kargo bagi customer ke tiket pelayaran baru.</p>
      </div>

      {/* CREATE FORM CARD */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent opacity-50 rounded-bl-full pointer-events-none"></div>
         
         <h3 className="font-black text-lg mb-6 text-blue-900 flex items-center gap-2">
            <span>⚓</span> Buka Keberangkatan Kapal
         </h3>
         
         <form action={submitBatch} className="grid grid-cols-1 md:grid-cols-4 gap-5 relative z-10">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Nama Kapal & VOY. ID</label>
              <input type="text" name="batch_number" required placeholder="Cth: KM Dempo Voy. 05" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Tipe Armada</label>
              <select name="transport_mode" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer">
                <option value="CARGO_SHIP">Kapal Kargo Roro</option>
                <option value="PASSENGER_SHIP">Kapal Pelni (Cepat)</option>
                <option value="AIR_FREIGHT">Pesawat Udara</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Batas Terima Paket (Closing)</label>
              <input type="datetime-local" name="closing_at" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div className="md:col-span-4 flex justify-end mt-2">
              <button type="submit" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2">
                 🚀 Launching Batch
              </button>
            </div>
         </form>
      </div>
      
      {/* HISTORY TABLE */}
      <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Daftar Jadwal Tertunda & Berangkat</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest">
                 <tr>
                   <th className="p-5">ID Voyage</th>
                   <th className="p-5">Moda Operasi</th>
                   <th className="p-5">Deadline Closing</th>
                   <th className="p-5">Status Kapal</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {batches.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-bold text-slate-700">{b.batch_number}</td>
                    <td className="p-5">
                       <span className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-[10px] font-bold border border-violet-100">
                         {b.transport_mode}
                       </span>
                    </td>
                    <td className="p-5 text-slate-500 font-medium">
                       {b.closing_at ? new Date(b.closing_at).toLocaleString('id-ID', { dateStyle: 'long' }) : 'Menunggu Jadwal'}
                    </td>
                    <td className="p-5">
                       <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                         {b.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>
    </div>
   )
}
