'use client';

import { useState } from 'react';
import { processBatchArrival } from '@/app/arrival/actions';

export default function ArrivalForm({ batchId, isArrived, shipmentCount }: { batchId: string, isArrived: boolean, shipmentCount: number }) {
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);

  const handleUnloadBatch = async () => {
     if (!confirm(`Konfirmasi: Anda akan melakukan bongkar muat untuk ${shipmentCount} karung di kapal ini dan melimpahkannya ke Fasilitas Destinasi/Delivery. Lanjutkan?`)) {
        return;
     }

     setIsPending(true);
     setFeedback(null);
     
     const formData = new FormData();
     formData.append('batch_id', batchId);
     
     try {
       const res = await processBatchArrival(formData);
       if (res.success) {
          setFeedback({ type: 'success', msg: res.message });
          // Force UI refresh with a slight delay
          setTimeout(() => {
             window.location.reload();
          }, 1500);
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
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center text-center">
       
       <div className="text-5xl mb-4">⚓</div>
       
       <h3 className="font-black text-xl text-slate-800 mb-2">
          {isArrived ? 'Kapal Telah Bersandar & Dibongkar' : 'Lakukan Bongkar Muat (Unload)'}
       </h3>
       
       <p className="text-slate-500 font-medium text-sm max-w-md mx-auto mb-6 leading-relaxed">
          {isArrived 
             ? 'Semua karung kargo dari manifest ini sukses dipindahkan ke fasilitas. Petugas meja Kasir & Delivery kini dapat melihat antreannya.'
             : 'Mengeklik tombol ini akan mengubah status manifest laut menjadi Tiba (Arrived), dan seketika menyapu selurus set karung/shipment di kapal ini menjadi "Arrived at Destination" dan langsung antre di menu Delivery meja kasir.'}
       </p>

       {feedback && (
         <div className={`p-4 rounded-xl border text-sm font-bold w-full max-w-md mb-6 ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {feedback.msg}
         </div>
       )}

       {!isArrived && (
         <button 
            type="button" 
            onClick={handleUnloadBatch}
            disabled={isPending || shipmentCount === 0}
            className="w-full max-w-md py-4 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-black tracking-widest rounded-xl shadow-[0_8px_20px_rgb(37,99,235,0.25)] active:scale-[0.98] transition-all"
         >
            {isPending ? 'MEMPROSES...' : 'BONGKAR SEMUA KARUNG (MASS ARRIVAL)'}
         </button>
       )}
    </div>
  )
}
