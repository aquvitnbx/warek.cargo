'use client';

import { useState } from 'react';
import { assignShipmentsToBatch } from '@/app/batches/actions';

interface BatchAssignmentFormProps {
  batchId: string;
  candidates: any[];
}

export default function BatchAssignmentForm({ batchId, candidates }: BatchAssignmentFormProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);

  const toggleAll = () => {
     if (selectedIds.length === candidates.length) {
        setSelectedIds([]);
     } else {
        setSelectedIds(candidates.map(c => c.id));
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
        setFeedback({ type: 'error', msg: 'Pilih minimal 1 karung untuk dimasukkan ke jadwal.' });
        return;
     }

     setIsPending(true);
     setFeedback(null);
     
     const formData = new FormData(e.currentTarget);
     
     try {
       const res = await assignShipmentsToBatch(formData, selectedIds);
       if (res.success) {
          setSelectedIds([]);
          setFeedback({ type: 'success', msg: res.message });
          // Note: NextJS revalidatePath in Server Action ensures the UI data updates immediately.
       } else {
          setFeedback({ type: 'error', msg: res.message });
       }
     } catch (err: any) {
        setFeedback({ type: 'error', msg: err.message || 'Terjadi kesalahan internal' });
     } finally {
        setIsPending(false);
     }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
       
       <input type="hidden" name="batch_id" value={batchId} />

       <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-black text-slate-800 text-sm tracking-wide flex items-center gap-2">
             ⏳ KANDIDAT KARUNG MASUK
          </h3>
          <button type="button" onClick={toggleAll} className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 transition-colors">
             {selectedIds.length === candidates.length && candidates.length > 0 ? 'Batal Pilih Semua' : 'Pilih Semua'}
          </button>
       </div>

       {feedback && (
         <div className={`mb-4 p-3 rounded-xl border text-xs font-bold ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {feedback.msg}
         </div>
       )}

       {candidates.length === 0 ? (
          <div className="py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-4 flex-1">
             <span className="text-4xl grayscale opacity-40 mb-2">🤷‍♂️</span>
             <h3 className="font-bold text-slate-500 mb-1 text-sm">Tidak ada kandidat siap layar</h3>
             <p className="text-[10px] text-slate-400 font-medium tracking-wide">Semua karung Customer Shipment berstatus DRAFT atau belum masuk pintu REPACKING.</p>
          </div>
       ) : (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 flex-1">
             {candidates.map(shp => (
                <label key={shp.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                   selectedIds.includes(shp.id) ? 'bg-blue-50/50 border-blue-300 shadow-sm' : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                }`}>
                   <div className="pt-1">
                     <input 
                       type="checkbox" 
                       checked={selectedIds.includes(shp.id)}
                       onChange={() => toggleOne(shp.id)}
                       className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                     />
                   </div>
                   <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start">
                         <span className="font-black text-slate-800 text-sm leading-tight">{shp.full_name}</span>
                         <span className="font-mono text-[10px] font-black text-blue-800 bg-white border border-blue-100 px-1.5 py-0.5 rounded tracking-wider shadow-sm">{shp.shipment_code}</span>
                      </div>
                      <div className="flex gap-4 mt-2">
                         <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Berat</span>
                            <span className="text-xs font-bold text-slate-700">{shp.total_weight_kg || 0} kg</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Volume (Dim)</span>
                            <span className="text-xs font-bold text-slate-700">{shp.total_volume_m3 || 0} m³</span>
                         </div>
                      </div>
                   </div>
                </label>
             ))}
          </div>
       )}

       <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-4">
             <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Dipilih</span>
             <span className="font-black text-xl text-blue-600">{selectedIds.length} <span className="text-sm font-bold text-slate-500">Karung</span></span>
          </div>

          <button 
             type="submit" 
             disabled={isPending || selectedIds.length === 0}
             className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl shadow-[0_8px_20px_rgb(37,99,235,0.2)] active:scale-[0.98] transition-all"
          >
             {isPending ? 'MEMPROSES...' : '🔥 ASSIGN KE KAPAL'}
          </button>
       </div>
    </form>
  )
}
