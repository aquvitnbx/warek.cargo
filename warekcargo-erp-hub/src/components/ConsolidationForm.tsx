'use client';

import { useState } from 'react';
import { createConsolidation, cancelInboundPackage } from '@/app/consolidation/actions';

interface ConsolidationFormProps {
  customerId: string;
  packages: any[];
  serviceTypes: any[];
}

export default function ConsolidationForm({ customerId, packages, serviceTypes }: ConsolidationFormProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(packages.map(p => p.id));
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);
  
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleCancelPackage = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     if (!cancelTarget) return;

     setIsCancelling(true);
     const formData = new FormData(e.currentTarget);
     formData.append('package_id', cancelTarget.id);

     try {
        const res = await cancelInboundPackage(formData);
        if (res.success) {
           window.location.reload();
        } else {
           setFeedback({ type: 'error', msg: res.message });
           setIsCancelling(false);
           setCancelTarget(null);
        }
     } catch (err: any) {
        setFeedback({ type: 'error', msg: err.message || 'Terjadi kesalahan sistem.' });
        setIsCancelling(false);
        setCancelTarget(null);
     }
  };

  return (
    <>
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
                       <div className="flex justify-between items-end mt-2">
                          <span className="text-[10px] font-bold text-slate-400">Masuk: {new Date(pkg.received_at).toLocaleDateString('id-ID')}</span>
                          <button 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCancelTarget(pkg); }}
                            className="text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-white bg-red-50 hover:bg-red-500 px-2 py-1 rounded transition-colors"
                          >
                            Batal Resi
                          </button>
                       </div>
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

    {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <form onSubmit={handleCancelPackage} className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-1 items-center text-center">
                 <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl mb-2">🗑️</div>
                 <h3 className="font-black text-slate-800">Batalkan Resi Individu</h3>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Anda akan membunuh tiket <strong className="text-slate-700">{cancelTarget.tracking_number}</strong>. Tiket ini akan terbuang selamanya dari peredaran eksekusi (TIDAK BISA DI-UNDO).
                 </p>
              </div>

              <div className="mt-2 space-y-4">
                 <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Kategori Alasan</label>
                    <select name="reason_category" required className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none">
                       <option value="">-- Pilih --</option>
                       <option value="CUSTOMER_CANCEL">Pelanggan Minta Batal</option>
                       <option value="REJECTED_QC">Tertolak QC Fisik</option>
                       <option value="CONFISCATED">Disita / Bermasalah</option>
                       <option value="SYSTEM_ERROR">Kesalahan Intake Sistem</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Catatan Detail (Opsional)</label>
                    <input type="text" name="reason_text" placeholder="Detail keterangan batal..." className="w-full text-sm p-3 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500" />
                 </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                 <button type="button" onClick={() => setCancelTarget(null)} disabled={isCancelling} className="px-4 py-2 font-bold text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Tutup</button>
                 <button type="submit" disabled={isCancelling} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-bold text-xs rounded-lg transition-colors">
                    {isCancelling ? 'Mengeksekusi...' : 'Hancurkan Resi'}
                 </button>
              </div>
           </form>
        </div>
     )}
    </>
  )
}
