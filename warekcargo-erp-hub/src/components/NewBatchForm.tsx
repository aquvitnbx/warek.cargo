'use client';

import { useState } from 'react';
import { createBatch } from '@/app/batches/actions';

interface NewBatchFormProps {
  hubs: any[];
  serviceTypes: any[];
  transportModes: any[];
  ports: any[];
}

export default function NewBatchForm({ hubs, serviceTypes, transportModes, ports }: NewBatchFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);
     
     const formData = new FormData(e.currentTarget);
     
     try {
       const res = await createBatch(formData);
       if (res.success) {
          window.location.href = `/batches/${res.id}`;
       } else {
          setFeedback({ type: 'error', msg: res.message });
          setIsPending(false);
       }
     } catch (err: any) {
        setFeedback({ type: 'error', msg: err.message || 'Terjadi kesalahan internal' });
        setIsPending(false);
     }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6">
       
       {feedback && (
         <div className={`p-4 rounded-xl border text-sm font-bold ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {feedback.msg}
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
             <label className="block text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Pilih Hub Gudang</label>
             <select name="hub_id" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                {hubs.map(h => <option key={h.id} value={h.id}>{h.name} ({h.code})</option>)}
             </select>
           </div>
           
           <div>
             <label className="block text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Mode Transportasi</label>
             <select name="transport_mode_code" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="">-- Pilih Moda --</option>
                {transportModes.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
             </select>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
             <label className="block text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Nama Kapal / Kendaraan</label>
             <input type="text" name="vessel_name" placeholder="Contoh: KM Gunung Dempo" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
           </div>
           <div>
             <label className="block text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Voyage / Nomor Perjalanan</label>
             <input type="text" name="voyage_number" placeholder="Contoh: V.102/2026" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
           <div>
             <label className="block text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Batas Akhir Titip (Closing)</label>
             <input type="datetime-local" name="closing_at" required className="w-full p-4 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
           </div>
           <div>
             <label className="block text-xs uppercase font-bold tracking-widest text-slate-500 mb-2 flex justify-between">
                <span>Waktu Keberangkatan (ETD)</span>
                <span className="text-red-500 relative -top-1">*</span>
             </label>
             <input type="datetime-local" name="etd_at" required className="w-full p-4 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
             <label className="block text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Pelabuhan Muat (Origin)</label>
             <select name="origin_port_code" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="">-- Kosongkan Jika TBA --</option>
                {ports.map(p => <option key={p.code} value={p.code}>{p.name} - {p.city}</option>)}
             </select>
           </div>
           <div>
             <label className="block text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Service Type Default</label>
             <select name="service_type_code" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                {serviceTypes.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
             </select>
           </div>
       </div>

       <button 
          type="submit" 
          disabled={isPending}
          className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl shadow-[0_8px_20px_rgb(37,99,235,0.2)] active:scale-[0.98] transition-all"
       >
          {isPending ? 'MEMPROSES...' : 'DAFTARKAN JADWAL'}
       </button>
    </form>
  )
}
