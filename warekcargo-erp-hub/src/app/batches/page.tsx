import pool from '@/lib/db';
import { submitBatch } from './actions';

export const revalidate = 0;

export default async function BatchesPage() {
   let batches = [];
   try {
     const res = await pool.query(`SELECT id, batch_code as batch_number, service_type_code, transport_mode_code as transport_mode, batch_status_code as status, closing_at, created_at FROM shipping_batches ORDER BY created_at DESC LIMIT 20`);
     batches = res.rows;
   } catch(e) {
     console.error("Fetch batches err: ", e);
   }

   return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Armada Kapal</span>
          </h2>
          <p className="text-slate-400 mt-2 text-sm font-medium">Buka gerbang (*gate*) keberangkatan baru untuk menampung manifest kargo pelanggan.</p>
      </div>

      {/* CREATE FORM CARD */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl relative overflow-hidden group">
         <div className="absolute top-[-30%] right-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
         
         <h3 className="font-black text-lg mb-6 text-white flex items-center gap-3 tracking-wide">
            <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">⚓</span> Jadwalkan Keberangkatan
         </h3>
         
         <form action={submitBatch} className="grid grid-cols-1 md:grid-cols-4 gap-5 relative z-10">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">Sandi Pelayaran (Kapal/Voyage)</label>
              <input type="text" name="batch_number" required placeholder="Cth: KM Dempo Voy. 05" className="w-full px-5 py-3.5 bg-slate-900/60 border border-white/10 rounded-2xl font-bold text-white placeholder-slate-600 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-inner" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Tipe Armada</label>
              <select name="transport_mode" className="w-full px-5 py-3.5 bg-slate-900/60 border border-white/10 rounded-2xl font-bold text-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer shadow-inner">
                <option value="CARGO_SHIP" className="bg-slate-900">⛴️ Kapal Kargo Roro</option>
                <option value="PASSENGER_SHIP" className="bg-slate-900">🛳️ Kapal Pelni (Cepat)</option>
                <option value="AIR_FREIGHT" className="bg-slate-900">✈️ Pesawat Udara</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Cut-Off (Closing)</label>
              <input type="datetime-local" name="closing_at" className="w-full px-5 py-3.5 bg-slate-900/60 border border-white/10 rounded-2xl font-bold text-slate-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-inner [color-scheme:dark]" />
            </div>
            <div className="md:col-span-4 flex justify-end mt-2">
              <button type="submit" className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 active:scale-95 text-white rounded-2xl font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2">
                 🚀 Launching Batch
              </button>
            </div>
         </form>
      </div>
      
      {/* HISTORY TABLE */}
      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
          <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="font-bold text-slate-200 tracking-wide">Radar Keberangkatan</h3>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-ping"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-slate-400 border-b border-white/5 text-[10px] font-black uppercase tracking-widest bg-black/20">
                 <tr>
                   <th className="p-6">Sandi Sandar</th>
                   <th className="p-6">Operasi</th>
                   <th className="p-6">Cut-Off Penerimaan</th>
                   <th className="p-6">Gate Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {batches.map((b: any) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-6 font-bold text-white neon-text-cyan">{b.batch_number}</td>
                    <td className="p-6">
                       <span className="px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-bold border border-indigo-500/30">
                         {b.transport_mode}
                       </span>
                    </td>
                    <td className="p-6 text-slate-400 font-medium group-hover:text-slate-300">
                       {b.closing_at ? new Date(b.closing_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }) : 'Menunggu Jadwal'}
                    </td>
                    <td className="p-6">
                       <span className="px-3 py-1.5 bg-white/10 text-slate-300 rounded-xl text-[10px] font-bold border border-white/10 shadow-sm">
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
