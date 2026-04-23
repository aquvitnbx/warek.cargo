'use client';

import { useState } from 'react';
import { updateBatchStatus } from '@/app/manifests/actions';

export default function BatchStatusButtons({ batchId, currentStatus }: { batchId: string, currentStatus: string }) {
   const [isPending, setIsPending] = useState(false);

   const handleUpdate = async (status: string, messagePrompt: string) => {
      const confirmed = confirm(messagePrompt);
      if (!confirmed) return;

      setIsPending(true);
      const reason = prompt('Masukkan catatan/alasan perubahan (opsional):') || '';

      const res = await updateBatchStatus(batchId, status, reason);
      if (!res.success) {
         alert('Gagal: ' + res.message);
      }
      setIsPending(false);
   };

   if (currentStatus === 'CANCELLED' || currentStatus === 'COMPLETED' || currentStatus === 'ARRIVED') {
      return <div className="text-sm font-bold text-slate-500 italic px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl">🔒 Sesi Pelayaran Ditutup</div>;
   }

   return (
      <div className="flex flex-wrap items-center gap-3">
         {currentStatus === 'OPEN' && (
            <button disabled={isPending} onClick={() => handleUpdate('CLOSED', 'Tutup manifest (Closing)? Karung baru tidak bisa masuk jadwal ini lagi.')} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold tracking-widest text-xs rounded-xl shadow-sm transition-colors">
               TUTUP MANIFEST / CLOSING
            </button>
         )}

         {(currentStatus === 'OPEN' || currentStatus === 'CLOSED') && (
            <button disabled={isPending} onClick={() => handleUpdate('DEPARTED', 'Konfirmasi: Kapal sungguhan sudah Berangkat (ETD Tercapai)? Peringatan: Status semua Karung akan berubah menjadi DISPATCHED!')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-widest text-xs rounded-xl shadow-sm transition-colors">
               🚀 KAPAL BERANGKAT (DEPARTED)
            </button>
         )}

         <button disabled={isPending} onClick={() => handleUpdate('CANCELLED', 'Batalkan jadwal ini sepenuhnya? Sistem akan membubarkan jadwal ini.')} className="px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold tracking-widest text-xs rounded-xl transition-colors">
            X BATALKAN JADWAL
         </button>
      </div>
   );
}
