'use client';

import { useState } from 'react';
import { createConsolidation } from '@/app/consolidation/actions';

interface ConsolidationFormProps {
  customerId: string;
  packages: any[];
  serviceTypes: any[];
}

export default function ConsolidationForm({ customerId, packages, serviceTypes }: ConsolidationFormProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(packages.map(p => p.id));
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);

  const toggleAll = () => {
     if (selectedIds.length === packages.length) {
        setSelectedIds([]);
     } else {
        setSelectedIds(packages.map(p => p.id));
     }
  };

  const toggleOne = (id: string) => {
     if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(x => x !== id));
     } else {
        setSelectedIds([...selectedIds, id]);
     }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     if (selectedIds.length === 0) {
        setFeedback({ type: 'error', msg: 'Pilih minimal 1 paket untuk dikonsolidasi.' });
        return;
     }

     setIsPending(true);
     setFeedback(null);
     
     const formData = new FormData(e.currentTarget);
     
     try {
       const res = await createConsolidation(formData, selectedIds);
       if (res.success) {
          // Instead of redirecting from action, let's just let it be or redirect client side
          window.location.href = '/consolidation';
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
       
       <input type="hidden" name="customer_id" value={customerId} />

       {/* Kiri: Daftar Paket */}
       <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
             <h3 className="font-black text-slate-800 text-sm tracking-wide">PILIHAN ISI KARUNG</h3>
             <button type="button" onClick={toggleAll} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                {selectedIds.length === packages.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
             </button>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
             {packages.map(pkg => (
                <label key={pkg.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                   selectedIds.includes(pkg.id) ? 'bg-blue-50/50 border-blue-300 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}>
                   <div className="pt-1">
                     <input 
                       type="checkbox" 
                       checked={selectedIds.includes(pkg.id)}
                       onChange={() => toggleOne(pkg.id)}
                       className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                     />
                   </div>
                   <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start">
                         <span className="font-mono font-black text-blue-900 tracking-wider text-sm">{pkg.tracking_number}</span>
                         <span className="px-2 py-0.5 bg-white text-[10px] font-bold text-slate-500 rounded border uppercase">{pkg.hub_code}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-1 truncate max-w-[200px] md:max-w-xs">{pkg.item_description || 'Isi tidak diketahui'}</p>
                      <span className="text-[10px] font-bold text-slate-400 mt-2">Masuk: {new Date(pkg.received_at).toLocaleDateString('id-ID')}</span>
                   </div>
                </label>
             ))}
          </div>
       </div>

       {/* Kanan: Form Data */}
       <div className="w-full lg:w-80 flex flex-col">
          <h3 className="font-black text-slate-800 text-sm tracking-wide border-b border-slate-100 pb-3 mb-4">DETAIL SHIPMENT</h3>
          
          {feedback && (
            <div className={`mb-4 p-3 rounded-xl border text-xs font-bold ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
               {feedback.msg}
            </div>
          )}

          <div className="space-y-4 flex-1">
             <div>
               <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Service Type (Layanan)</label>
               <select name="service_type_code" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                  {serviceTypes.map(s => (
                     <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
               </select>
             </div>

             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center text-center mt-6">
                <span className="text-3xl mb-2">📦</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Total Terpilih</span>
                <span className="text-2xl font-black text-blue-600">{selectedIds.length} <span className="text-sm font-bold text-slate-500">Resi</span></span>
             </div>
          </div>

          <button 
             type="submit" 
             disabled={isPending || selectedIds.length === 0}
             className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl shadow-[0_8px_20px_rgb(37,99,235,0.2)] active:scale-[0.98] transition-all"
          >
             {isPending ? 'MEMPROSES...' : 'BUAT SHIPMENT'}
          </button>
       </div>
    </form>
  )
}
