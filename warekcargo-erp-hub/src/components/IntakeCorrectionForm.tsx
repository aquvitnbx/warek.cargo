'use client';

import { useState } from 'react';
import { updateIntakePackage, voidIntakePackage } from '@/app/intake/actions';

export default function IntakeCorrectionForm({ packageData, isBound, customers, returnUrl = '/intake' }: any) {
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);
     
     const formData = new FormData(e.currentTarget);
     formData.append('package_id', packageData.id);

     const res = await updateIntakePackage(formData);
     if (res.success) {
        setFeedback({ type: 'success', msg: 'Data resi hulu dan jejak audit berhasil diperbarui!' });
     } else {
        setFeedback({ type: 'error', msg: res.message || 'Gagal memperbarui data intake.' });
     }
     setIsPending(false);
  };

  const handleVoid = async () => {
     const reason = prompt("WAJIB: Tulis alasan Pembatalan/Void Resi ini secara detail:");
     if (!reason || reason.length < 5) {
        alert("Void dibatalkan. Alasan admin terlalu singkat atau kosong.");
        return;
     }

     setIsPending(true);
     const res = await voidIntakePackage(packageData.id, reason);
     if (res.success) {
        window.location.href = returnUrl;
     } else {
        setFeedback({ type: 'error', msg: res.message || 'Gagal melakukan void intake.' });
        setIsPending(false);
        setShowVoidConfirm(false);
     }
  };

  if (packageData.package_status_code === 'CANCELLED') {
     return (
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-[2rem]">
           <h2 className="text-xl font-black text-red-700">RESI INI DIVOID / DIBATALKAN</h2>
           <p className="text-red-600 mt-2 text-sm font-medium">Data paket ini tidak dapat diproses lebih lanjut.</p>
        </div>
     );
  }

  return (
    <div className="space-y-6">
       {feedback && (
          <div className={`p-4 rounded-xl border text-sm font-bold shadow-sm ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
             {feedback.msg}
          </div>
       )}

       {isBound && (
          <div className="bg-amber-50 p-4 border border-amber-200 rounded-xl mb-4">
             <p className="text-xs text-amber-800 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">🔒 HARD LOCK AKTIF</p>
             <p className="text-xs text-amber-700 font-medium leading-relaxed">
                Paket ini sudah tergabung ke dalam Karung (Shipment).<br/>
                Koreksi <strong>Pelanggan, Qty, dan Marketplace</strong> telah dilarang mutlak karena bisa merusak Tagihan Hilir.<br/>
                Anda hanya diizinkan memperbarui data deskripsi administratif.
             </p>
          </div>
       )}

       <form onSubmit={handleUpdate} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             
             <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Pelanggan Pengirim/Penerima</label>
                <select name="customer_id" defaultValue={packageData.customer_id || ""} disabled={isBound} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                    <option value="">-- KOSONG -- (Relasi Putus)</option>
                    {customers.map((c: any) => (
                       <option key={c.id} value={c.id}>{c.customer_code} - {c.full_name}</option>
                    ))}
                </select>
             </div>

             <div>
               <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Penyetor Khusus / Toko</label>
               <input type="text" name="sender_or_store" defaultValue={packageData.sender_or_store || ""} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Opsional nama di luar kontak..." />
             </div>

             <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Marketplace (Toko Online)</label>
                <select name="marketplace_code" defaultValue={packageData.marketplace_code || ""} disabled={isBound} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                    <option value="">- TANPA MARKETPLACE -</option>
                    <option value="SHOPEE">SHOPEE</option>
                    <option value="TOKOPEDIA">TOKOPEDIA</option>
                    <option value="TIKTOK_SHOP">TIKTOK SHOP</option>
                    <option value="LAZADA">LAZADA</option>
                    <option value="BLIBLI">BLIBLI</option>
                </select>
             </div>

             <div>
               <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Kuantitas (Kardus)</label>
               <input type="number" name="quantity" defaultValue={packageData.quantity} min="1" disabled={isBound} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" />
             </div>

             <div className="md:col-span-2">
               <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Deskripsi Barang Cepat</label>
               <input type="text" name="item_description" defaultValue={packageData.item_description || ""} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Cth: Baju dan alat mandi" />
             </div>

             <div className="md:col-span-2">
               <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Catatan Kondisi Barang (Cacat Fisik Saat Tiba)</label>
               <textarea name="condition_notes" defaultValue={packageData.condition_notes || ""} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} placeholder="Cth: Dus sedikit robek di sudut kanan atas saat kami terima." />
             </div>

             <div className="md:col-span-2 bg-blue-50/50 p-4 border border-blue-200 rounded-xl">
                 <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-600 mb-2">Alasan Koreksi <span className="text-red-500 font-bold">*WAJIB (Audit Trail)*</span></label>
                 <textarea name="revision_note" required className="w-full p-3 bg-white border border-blue-100 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none shadow-inner" rows={2} placeholder="Sebutkan mengapa Anda mengedit data ini demi riwayat sistem..."></textarea>
             </div>
          </div>

          <div className="flex gap-4 items-center justify-end mt-4">
              {!isBound ? (
                 <>
                   {!showVoidConfirm ? (
                       <button type="button" onClick={() => setShowVoidConfirm(true)} className="px-6 py-3 border border-red-200 text-red-600 font-bold text-sm tracking-wide rounded-xl hover:bg-red-50 transition-colors">
                          VOID RECORD INI
                       </button>
                   ) : (
                       <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600 font-bold pr-2">Yakin Void Resi Barcode?</span>
                          <button type="button" onClick={() => setShowVoidConfirm(false)} className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50">KEMBALI</button>
                          <button type="button" disabled={isPending} onClick={handleVoid} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">IYA, VOID</button>
                       </div>
                   )}
                 </>
              ) : (
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mr-auto">Void tidak tersedia (Terkunci Karung)</p>
              )}

              <button type="submit" disabled={isPending} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl shadow-sm transition-all whitespace-nowrap">
                  {isPending ? 'MENCATAT LOG...' : 'SIMPAN KOREKSI'}
              </button>
          </div>
       </form>
    </div>
  );
}
