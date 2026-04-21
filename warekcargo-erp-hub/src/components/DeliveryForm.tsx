'use client';

import { useState } from 'react';
import { updateDeliveryStatus } from '@/app/delivery/actions';

interface DeliveryFormProps {
  shipmentId: string;
  shipment: any;
}

export default function DeliveryForm({ shipmentId, shipment }: DeliveryFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);
  
  // Track selected status button
  const [statusVal, setStatusVal] = useState(shipment.pickup_delivery_status_code);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);
     
     const formData = new FormData(e.currentTarget);
     formData.append('delivery_status', statusVal);
     
     try {
       const res = await updateDeliveryStatus(formData);
       if (res.success) {
          window.location.href = '/delivery';
       } else {
          setFeedback({ type: 'error', msg: res.message });
          setIsPending(false);
       }
     } catch (err: any) {
        setFeedback({ type: 'error', msg: err.message || 'Terjadi kesalahan internal' });
        setIsPending(false);
     }
  };

  const isCompleted = shipment.shipment_status_code === 'COMPLETED';
  const isUnpaid = shipment.payment_status_code !== 'PAID';

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6">
       <input type="hidden" name="shipment_id" value={shipmentId} />

       {feedback && (
         <div className={`p-4 rounded-xl border text-sm font-bold ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {feedback.msg}
         </div>
       )}

       {isUnpaid && !isCompleted && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm flex items-start gap-3">
             <div className="text-xl">⚠️</div>
             <div>
                <h4 className="font-black text-red-800 text-sm tracking-wide">STATUS PEMBAYARAN BELUM LUNAS</h4>
                <p className="text-xs text-red-600 font-medium mt-1">
                   Tagihan paket ini belum tercatat lunas di Kasir. Pastikan barang diserahkan hanya jika sudah ada instruksi pembayaran (misal COD/transfer manual).
                </p>
             </div>
          </div>
       )}

       {isCompleted && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-sm text-center">
             <div className="text-3xl mb-2">✅</div>
             <h4 className="font-black text-emerald-800 text-lg tracking-tight">PENGIRIMAN SELESAI</h4>
             <p className="text-sm text-emerald-600 font-medium mt-1 mb-3">
                Paket telah sukses {shipment.pickup_delivery_status_code === 'PICKED_UP' ? 'diambil oleh konsumen' : 'diantar oleh kurir'}.
             </p>
             <div className="inline-block bg-white px-4 py-2 rounded-lg border border-emerald-200 text-sm font-bold text-slate-700">
                Penerima Akhir: <span className="text-emerald-700">{shipment.delivery_recipient_name || 'Tidak dicatat'}</span>
             </div>
          </div>
       )}

       <div className="space-y-4">
          <h3 className="font-black text-slate-800 text-sm tracking-wide border-b border-slate-100 pb-3">BUKTI SERAH TERIMA</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Nama Penerima/Pengambil</label>
                <input 
                  type="text" 
                  name="delivery_recipient_name" 
                  defaultValue={shipment.delivery_recipient_name || ""}
                  disabled={isCompleted}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  placeholder="Misal: Andi (Keluarga) / Sesuai Aplikasi"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Catatan Tambahan (Opsional)</label>
                <input 
                  type="text" 
                  name="delivery_notes" 
                  defaultValue={shipment.delivery_notes || ""}
                  disabled={isCompleted}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  placeholder="Diambil pakai pickup / dititipkan pos satpam"
                />
              </div>
          </div>
       </div>

       {!isCompleted && (
         <div className="space-y-4 mt-2">
            <h3 className="font-black text-slate-800 text-sm tracking-wide border-b border-slate-100 pb-3">TINDAKAN SELANJUTNYA</h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
               <button 
                  type="button"
                  onClick={() => setStatusVal('READY_FOR_PICKUP')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${statusVal === 'READY_FOR_PICKUP' ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm scale-[1.02]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                  📦 Menunggu Diambil
               </button>
               <button 
                  type="button"
                  onClick={() => setStatusVal('OUT_FOR_DELIVERY')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${statusVal === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm scale-[1.02]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                  🛵 Sedang Diantar
               </button>
               
               {/* Final states */}
               <button 
                  type="button"
                  onClick={() => setStatusVal('PICKED_UP')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${statusVal === 'PICKED_UP' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm scale-[1.02]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                  ✅ Selesai (Diambil)
               </button>
               <button 
                  type="button"
                  onClick={() => setStatusVal('DELIVERED')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${statusVal === 'DELIVERED' ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm scale-[1.02]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                  🏁 Selesai (Diantar)
               </button>
            </div>
         </div>
       )}

       {!isCompleted && (
         <button 
            type="submit" 
            disabled={isPending}
            className="w-full mt-4 py-4 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl shadow-[0_8px_20px_rgb(0,0,0,0.15)] active:scale-[0.98] transition-all"
         >
            {isPending ? 'MEMPROSES...' : 'REKAM UPDATE & SIMPAN'}
         </button>
       )}
    </form>
  )
}
