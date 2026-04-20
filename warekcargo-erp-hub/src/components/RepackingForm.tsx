'use client';

import { useState } from 'react';
import { submitRepack } from '@/app/repacking/actions';

interface RepackingFormProps {
  shipmentId: string;
  shipment: any;
  packages: any[];
}

export default function RepackingForm({ shipmentId, shipment, packages }: RepackingFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);
     
     const formData = new FormData(e.currentTarget);
     
     try {
       const res = await submitRepack(formData);
       if (res.success) {
          window.location.href = '/repacking';
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
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col lg:flex-row gap-8">
       
       <input type="hidden" name="shipment_id" value={shipmentId} />

       {/* Kiri: Daftar Paket dalam Karung */}
       <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
             <h3 className="font-black text-slate-800 text-sm tracking-wide">RUMUSAN ISI KARUNG</h3>
             <span className="text-xs font-bold text-slate-400">Telah Disegel</span>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
             {packages.map(pkg => (
                <div key={pkg.id} className="flex items-start gap-4 p-4 rounded-xl border bg-slate-50 border-slate-200">
                   <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start">
                         <span className="font-mono font-black text-blue-900 tracking-wider text-sm">{pkg.tracking_number}</span>
                         <span className="px-2 py-0.5 bg-white text-[10px] font-bold text-slate-500 rounded border uppercase">{pkg.hub_code}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1 truncate max-w-[200px] md:max-w-xs ">{pkg.item_description || 'Tanpa deskripsi'}</p>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Kanan: Input Form Repacking */}
       <div className="w-full lg:w-96 flex flex-col">
          <h3 className="font-black text-slate-800 text-sm tracking-wide border-b border-slate-100 pb-3 mb-4">INPUT FISIK (TIMBANG & UKUR)</h3>
          
          {feedback && (
            <div className={`mb-4 p-3 rounded-xl border text-xs font-bold ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
               {feedback.msg}
            </div>
          )}

          <div className="space-y-5 flex-1">
             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Berat Total (Kg)</label>
                   <input 
                     type="number" 
                     name="total_weight_kg" 
                     step="0.01" 
                     min="0.1" 
                     defaultValue={shipment.total_weight_kg || ""}
                     required 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="0.00"
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Dimensi (M³)</label>
                   <input 
                     type="number" 
                     name="total_volume_m3" 
                     step="0.0001" 
                     min="0" 
                     defaultValue={shipment.total_volume_m3 || ""}
                     required 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="0.0000"
                   />
                 </div>
             </div>

             <div>
               <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Catatan Finalisasi (Opsional)</label>
               <textarea 
                  name="notes" 
                  rows={3} 
                  defaultValue={shipment.notes || ""}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Kondisi karung aman, menggunakan 2 lapis plastik..."
               ></textarea>
             </div>

             <div className="bg-amber-50 p-4 border border-amber-200 rounded-xl">
                 <p className="text-[10px] text-amber-800 font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><span className="text-sm">⚠️</span> Shortcut Info (Foto)</p>
                 <p className="text-xs text-amber-700 font-medium">Doktrin Schema V3 saat ini hanya mendukung *package_photos* untuk per-resi. Fitur foto karung (*shipment_photos*) akan diaktifkan setelah tabel database di-upgrade.</p>
             </div>
          </div>

          <button 
             type="submit" 
             disabled={isPending}
             className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl shadow-[0_8px_20px_rgb(16,185,129,0.3)] active:scale-[0.98] transition-all"
          >
             {isPending ? 'MENYIMPAN...' : 'FINALISASI & SEGEL'}
          </button>
       </div>
    </form>
  )
}
