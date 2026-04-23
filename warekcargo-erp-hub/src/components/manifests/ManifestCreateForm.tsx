'use client';

import { useState } from 'react';
import { createBatchManifest } from '@/app/manifests/actions';

export default function ManifestCreateForm({ hubs }: { hubs: any[] }) {
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);
     
     const formData = new FormData(e.currentTarget);
     
     // Inject hub code based on select
     const selectedHubId = formData.get('hub_id') as string;
     const hub = hubs.find(h => h.id === selectedHubId);
     if (hub) formData.append('hub_code', hub.code);

     const res = await createBatchManifest(formData);
     if (res.success) {
        window.location.href = `/manifests/${res.batch_id}`;
     } else {
        setFeedback({ type: 'error', msg: res.message });
        setIsPending(false);
     }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6">
       
       {feedback && (
          <div className="p-4 rounded-xl border bg-red-50 border-red-200 text-red-700 text-sm font-bold shadow-sm">
             {feedback.msg}
          </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="md:col-span-2">
             <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Asal Keberangkatan (Hub)</label>
             <select name="hub_id" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                 {hubs.map((h: any) => (
                    <option key={h.id} value={h.id}>{h.code} - {h.name}</option>
                 ))}
             </select>
           </div>
           
           <div>
             <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Modus Angkutan</label>
             <select name="transport_mode_code" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                 <option value="KAPAL_KARGO">Kapal Kargo Laut (Pelni/SPIL/dll)</option>
                 <option value="KAPAL_PENUMPANG">Kapal Penumpang</option>
                 <option value="PESAWAT">Pesawat / Kargo Udara</option>
             </select>
           </div>
           
           <div>
             <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Jenis Layanan Prioritas</label>
             <select name="service_type_code" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                 <option value="HEMAT">Hemat (Umum)</option>
                 <option value="CEPAT">Cepat</option>
                 <option value="EXPRESS">Express (Prioritas)</option>
             </select>
           </div>

           <div>
             <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Nama Armada / Kapal</label>
             <input type="text" name="vessel_name" required className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cth: KM Gunung Dempo" />
           </div>

           <div>
             <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Voyage / Nomor Penerbangan</label>
             <input type="text" name="voyage_number" className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cth: VOY-1234 (Opsional)" />
           </div>

           <div>
             <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Jadwal Keberangkatan (ETD)</label>
             <input type="date" name="etd_at" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
           </div>

           <div>
             <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Batas Akhir Titipan (Closing Time)</label>
             <input type="date" name="closing_at" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
             <p className="text-[10px] text-slate-400 mt-1 ml-1 font-medium">Bila kosong, disamakan dengan hari keberangkatan ETD.</p>
           </div>

           <div className="md:col-span-2">
             <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Catatan Operasional (Opsional)</label>
             <textarea name="notes" className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} placeholder="Cth: Cuaca buruk, jadwal bisa delay..."></textarea>
           </div>
       </div>

       <div className="border-t border-slate-100 flex justify-end gap-3 pt-6 mt-2">
          <a href="/manifests" className="px-6 py-3 font-bold text-sm tracking-widest text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">BATAL</a>
          <button type="submit" disabled={isPending} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black tracking-widest text-sm rounded-xl transition-all shadow-sm">
             {isPending ? 'MENDAFTARKAN...' : 'BUAT JADWAL ARMADA'}
          </button>
       </div>
    </form>
  )
}
