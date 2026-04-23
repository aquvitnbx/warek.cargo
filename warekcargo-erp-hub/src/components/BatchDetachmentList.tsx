'use client';

import { useState } from 'react';
import { removeShipmentFromBatch } from '@/app/batches/actions';
import { useRouter } from 'next/navigation';

export default function BatchDetachmentList({ assignedShipments, batchId, batchStatus }: any) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [detachTarget, setDetachTarget] = useState<any>(null);
  const [feedback, setFeedback] = useState<{type: 'error'|'success', msg: string}|null>(null);

  const lockedStatuses = ['ARRIVED_DESTINATION', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED'];

  const handleDetachSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);

     const formData = new FormData(e.currentTarget);
     const revisionNote = formData.get('revision_note') as string;

     if (revisionNote.length < 5) {
        setFeedback({ type: 'error', msg: 'Alasan pencabutan terlalu singkat.' });
        setIsPending(false);
        return;
     }

     const res = await removeShipmentFromBatch(detachTarget.id, batchId, revisionNote);
     if (res.success) {
        setDetachTarget(null);
        router.refresh();
     } else {
        setFeedback({ type: 'error', msg: res.message });
     }
     setIsPending(false);
  };

  return (
    <>
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto relative">
         {feedback && (
            <div className={`p-3 text-xs font-bold rounded-lg border shadow-sm mb-3 ${feedback.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
               {feedback.msg}
            </div>
         )}
         {assignedShipments.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center opacity-50">
                <span className="text-4xl grayscale mb-2">⚓</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Belum ada muatan</span>
            </div>
         ) : (
            assignedShipments.map((shp: any) => {
               const isLocked = lockedStatuses.includes(shp.shipment_status_code);

               return (
                  <div key={shp.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-sm hover:border-blue-300 transition-colors">
                     <div className="pt-1"><span className="text-xl">📦</span></div>
                     <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-start">
                           <span className="font-black text-slate-800 text-sm">{shp.full_name}</span>
                           <div className="flex items-center gap-2">
                             <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{shp.shipment_code}</span>
                             {isLocked ? (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title="Terkunci secara lokasi">LOCK</span>
                             ) : (
                                <button type="button" onClick={() => setDetachTarget(shp)} className="text-[9px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 transition-colors uppercase">Cabut</button>
                             )}
                           </div>
                        </div>
                        <div className="flex gap-4 mt-2">
                           <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Berat</span>
                              <span className="text-xs font-bold text-slate-700">{shp.total_weight_kg} kg</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Volume (Dim)</span>
                              <span className="text-xs font-bold text-slate-700">{shp.total_volume_m3} m³</span>
                           </div>
                        </div>
                     </div>
                  </div>
               );
            })
         )}
      </div>

      {detachTarget && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 rounded-2xl">
           <form onSubmit={handleDetachSubmit} className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200">
               <div>
                  <h3 className="font-black text-lg text-slate-800">Cabut dari Kapal?</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                     Anda akan mengeluarkan resi <strong className="text-slate-700">{detachTarget.shipment_code}</strong> dari manifest ini. Status paket akan turun kembali ke <strong className="text-amber-600">READY_FOR_DISPATCH</strong>.
                  </p>
               </div>
               
               <div className="flex flex-col gap-2">
                 <label className="text-[10px] uppercase font-bold tracking-widest text-slate-600">Alasan Pencabutan <span className="text-red-500">*WAJIB LOG</span></label>
                 <textarea name="revision_note" rows={2} required className="w-full text-sm font-medium p-3 border border-red-200 bg-red-50/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 resize-none transition-shadow" placeholder="Cth: Barang tidak muat di lambung, ditinggal di pelabuhan."></textarea>
               </div>

               <div className="flex gap-2 justify-end mt-2">
                  <button type="button" onClick={() => {setDetachTarget(null); setFeedback(null);}} disabled={isPending} className="px-4 py-2 font-bold text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                  <button type="submit" disabled={isPending} className="px-4 py-2 font-bold text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors disabled:opacity-50">
                     {isPending ? 'MENCABUT...' : 'IYA, KELUARKAN'}
                  </button>
               </div>
           </form>
        </div>
      )}
    </>
  );
}
