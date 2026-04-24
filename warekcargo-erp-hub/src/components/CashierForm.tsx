'use client';

import { useState } from 'react';
import { setFinalCharge, addPayment, voidPaymentRecord } from '@/app/finance/actions';
import { cancelConsolidation } from '@/app/repacking/actions';

type ShipmentPricingRate = {
  min_weight_kg: number | string | null;
  min_volume_m3: number | string | null;
  price_per_kg: number | string | null;
  price_per_m3: number | string | null;
};

type CashierShipment = {
  id: string;
  final_charge_amount: number | string | null;
  amount_paid: number | string | null;
  payment_status_code: string;
  pricing_rate: ShipmentPricingRate | null;
  total_weight_kg: number | string | null;
  total_volume_m3: number | string | null;
  shipment_status_code: string;
};

type PaymentRow = {
  id: string;
  amount: number | string;
  method_name: string;
  paid_at: string | Date;
  paid_to: string | null;
  payment_reference: string | null;
};

type PaymentMethodOption = {
  code: string;
  name: string;
};

interface CashierFormProps {
  shipment: CashierShipment;
  payments: PaymentRow[];
  paymentMethods: PaymentMethodOption[];
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function CashierForm({ shipment, payments, paymentMethods }: CashierFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);
  const [isEditingCharge, setIsEditingCharge] = useState(false);
  
  // State Void Cicilan & Transaksi
  const [voidTarget, setVoidTarget] = useState<{id: string, amount: string} | null>(null);
  const [doomVoidOpen, setDoomVoidOpen] = useState(false);

  const formatIdr = (num: number) => {
     if (!num) return 'Rp 0';
     return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const isFinalized = !!shipment.final_charge_amount;
  const bill = isFinalized ? Number(shipment.final_charge_amount) : 0;
  const paid = Number(shipment.amount_paid || 0);
  const isPaidOff = shipment.payment_status_code === 'PAID';
  const remaining = bill - paid;

  // Logika Auto Pricing Engine berbasis Master Rate 
  const rate = shipment.pricing_rate;
  let standardEstimate = 0;
  let chargeBreakdown = null;

  if (rate) {
     const weightKg = Number(shipment.total_weight_kg) || 0;
     const volM3 = Number(shipment.total_volume_m3) || 0;
     
     const appliedWeight = Math.max(weightKg, Number(rate.min_weight_kg));
     const appliedVol = Math.max(volM3, Number(rate.min_volume_m3));

     const costWgt = appliedWeight * Number(rate.price_per_kg);
     const costVol = appliedVol * Number(rate.price_per_m3);
     
     if (costWgt >= costVol) {
        standardEstimate = costWgt;
        chargeBreakdown = { type: 'BERAT', amount: appliedWeight, unit: 'Kg', cost: costWgt };
     } else {
        standardEstimate = costVol;
        chargeBreakdown = { type: 'VOLUME', amount: appliedVol, unit: 'm³', cost: costVol };
     }
  }

  const handleSetCharge = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);
     const formData = new FormData(e.currentTarget);
     
     try {
       const res = await setFinalCharge(formData);
       if (res.success) {
          setFeedback({ type: 'success', msg: 'Nilai tagihan final dikunci.' });
          setIsEditingCharge(false);
       }
       else setFeedback({ type: 'error', msg: res.message || 'Gagal menyimpan tagihan.' });
     } catch (err: unknown) {
        setFeedback({ type: 'error', msg: getErrorMessage(err, 'Gagal menyimpan tagihan.') });
     } finally {
        setIsPending(false);
     }
  };

  const handleAddPayment = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);
     const formElement = e.currentTarget;
     const formData = new FormData(formElement);
     
     try {
       const res = await addPayment(formData);
       if (res.success) {
          setFeedback({ type: 'success', msg: 'Pembayaran berhasil dicatat!' });
          formElement.reset();
       } else {
          setFeedback({ type: 'error', msg: res.message || 'Gagal mencatat pembayaran.' });
       }
     } catch (err: unknown) {
        setFeedback({ type: 'error', msg: getErrorMessage(err, 'Gagal mencatat pembayaran.') });
     } finally {
        setIsPending(false);
     }
  };

  const handleVoidPayment = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);
     const formData = new FormData(e.currentTarget);
     formData.append('shipment_id', shipment.id);
     
     try {
       const res = await voidPaymentRecord(formData);
       if (res.success) {
          setFeedback({ type: 'success', msg: res.message || 'Cicilan divoid!' });
          setVoidTarget(null);
       } else {
          setFeedback({ type: 'error', msg: res.message || 'Gagal membatalkan pembayaran.' });
       }
     } catch (err: unknown) {
        setFeedback({ type: 'error', msg: getErrorMessage(err, 'Gagal membatalkan pembayaran.') });
     } finally {
        setIsPending(false);
     }
  };

  const handleDoomVoid = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);
     const formData = new FormData(e.currentTarget);
     
     try {
       const shipmentId = formData.get('shipment_id') as string;
       const reason = formData.get('reason') as string;
       const res = await cancelConsolidation(shipmentId, reason);
       if (res.success) {
          setFeedback({ type: 'success', msg: 'Transaksi berhasil di-Void Mutlak. Barang dikepras keluar.' });
          setDoomVoidOpen(false);
          // Halaman akan revalidate dan info akan reset otomatis (atau direct ke finance dashboard jika status berubah void)
          window.location.href = '/finance'; 
       } else {
          setFeedback({ type: 'error', msg: res.message || 'Gagal membatalkan konsolidasi.' });
       }
     } catch (err: unknown) {
        setFeedback({ type: 'error', msg: getErrorMessage(err, 'Gagal membatalkan konsolidasi.') });
     } finally {
        setIsPending(false);
     }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
       
       {/* PANEL KIRI: Tagihan & Pembayaran Baru */}
       <div className="w-full lg:w-1/2 space-y-6">
          
          {feedback && (
            <div className={`p-4 rounded-xl border text-sm font-bold shadow-sm ${feedback.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
               {feedback.msg}
            </div>
          )}

          {/* BLOCK 1: Set Final Tagihan */}
          {(!isFinalized || isEditingCharge) ? (
             <form onSubmit={handleSetCharge} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-black text-slate-800 text-sm tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                   <span>🔒 KUNCI TAGIHAN FINAL</span>
                   <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase">Tahap 1</span>
                </h3>
                
                {rate ? (
                    <div className="bg-blue-50/50 p-4 border border-dashed border-blue-200 rounded-xl mb-5 text-left text-sm text-blue-900 shadow-inner">
                       <p className="font-bold flex items-center gap-2 mb-2">
                          <span className="bg-blue-200 text-blue-800 p-1 rounded">⚙️</span> 
                          Rekomendasi Auto-Pricing (Tarif Master)
                       </p>
                       <p className="leading-relaxed">
                          Sistem menyarankan <strong>{formatIdr(standardEstimate)}</strong> berdasarkan perhitungan titik <strong className="uppercase bg-blue-100 px-1 rounded">{chargeBreakdown?.type}</strong>: <br/> 
                          <span className="font-mono text-xs">{chargeBreakdown?.amount} {chargeBreakdown?.unit}</span> x rate dasar {chargeBreakdown?.type === 'BERAT' ? formatIdr(Number(rate.price_per_kg)) : formatIdr(Number(rate.price_per_m3))}.
                       </p>
                       <p className="text-[10px] uppercase font-bold tracking-widest text-blue-500 mt-2">* Admin dapat mengubah angka di bawah jika diperlukan (diskon/nego).</p>
                    </div>
                ) : (
                    <div className="bg-amber-50 p-4 border border-dashed border-amber-200 rounded-xl mb-4 text-center">
                       <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-relaxed">Peringatan: Master Rate Rute Belum Diatur</p>
                       <p className="text-xs text-amber-800 mt-1">Harap tentukan tagihan final secara manual dengan kesepakatan.</p>
                       <input type="hidden" name="no_rate_found" value="1" />
                    </div>
                )}

                <div className="space-y-4">
                  <input type="hidden" name="shipment_id" value={shipment.id} />
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Nilai Final Keringat (Rp)</label>
                    <input 
                      type="number" 
                      name="final_charge_amount" 
                      defaultValue={standardEstimate}
                      min="1000"
                      required 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                       Alasan Tagihan Bersih <span className="text-red-500 bg-red-50 px-1 rounded">WAJIB</span>
                    </label>
                    <textarea 
                      name="revision_note" 
                      required
                      placeholder="Contoh: Sesuai Harga AutoPricing, atau Diskon 50rb kesepakatan Bapak X"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    ></textarea>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                   {isFinalized && (
                     <button 
                        type="button"
                        disabled={isPending}
                        onClick={() => setIsEditingCharge(false)}
                        className="w-1/3 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold tracking-widest rounded-xl transition-all"
                     >
                        BATAL
                     </button>
                   )}
                   <button 
                      type="submit" 
                      disabled={isPending}
                      className="flex-1 py-4 bg-slate-800 hover:bg-black disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl transition-all"
                   >
                      {isPending ? 'MEMPROSES...' : (isFinalized ? 'SIMPAN REVISI' : 'KUNCI TAGIHAN')}
                   </button>
                </div>
             </form>
          ) : (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110 group-hover:bg-amber-50"></div>
                
                {/* Tombol Edit Tersembunyi */}
                <button 
                   onClick={() => setIsEditingCharge(true)}
                   className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-amber-600 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                   ✏️ Edit Nominal
                </button>

                <div className="relative z-10">
                   <h3 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1">Total Tagihan Karung</h3>
                   <div className="text-4xl font-black text-blue-600">{formatIdr(bill)}</div>
                   <div className="mt-4 flex justify-center gap-6 border-t border-slate-100 pt-4">
                      <div className="flex flex-col">
                         <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Telah Dibayar</span>
                         <span className="font-bold text-emerald-600">{formatIdr(paid)}</span>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Kekurangan</span>
                         <span className="font-bold text-red-500">{formatIdr(remaining > 0 ? remaining : 0)}</span>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* BLOCK 2: Form Bayar Cicil / Lunas */}
          {isFinalized && !isPaidOff && (
             <form onSubmit={handleAddPayment} className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-100">
                <h3 className="font-black text-slate-800 text-sm tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                   <span>💸 TERIMA PEMBAYARAN</span>
                   <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded uppercase">Tahap 2</span>
                </h3>

                <div className="space-y-4">
                  <input type="hidden" name="shipment_id" value={shipment.id} />
                  
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Metode Pembayaran</label>
                    <select name="payment_method_code" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                       {paymentMethods.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 flex justify-between">
                       <span>Nominal Dibayar (Rp)</span>
                       <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => {
                          const el = document.getElementById('py_amount') as HTMLInputElement;
                          if(el) el.value = remaining.toString();
                       }}>
                          Set Lunas
                       </span>
                    </label>
                    <input 
                      id="py_amount"
                      type="number" 
                      name="amount" 
                      min="1000"
                      max={remaining + 1000000} // Boleh lebih dikit buat kembalian? Enggak usah ketat banget.
                      defaultValue={Math.max(remaining, 0)}
                      required 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Penerima Kasir</label>
                    <input type="text" name="paid_to" placeholder="Nama Kasir (Opsional)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Referensi (Bank/Buku Catatan)</label>
                    <input type="text" name="payment_reference" placeholder="Trf BCA A/N Budi..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <button 
                   type="submit" 
                   disabled={isPending}
                   className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl shadow-[0_8px_20px_rgb(37,99,235,0.2)] active:scale-[0.98] transition-all"
                >
                   {isPending ? 'MENCATAT...' : 'TAMBAH PEMBAYARAN'}
                </button>
             </form>
          )}

          {isPaidOff && (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm">
               <span className="text-5xl mb-4">🏆</span>
               <h3 className="text-emerald-800 font-black tracking-widest uppercase text-sm">KARUNG LUNAS</h3>
               <p className="text-emerald-700 mt-2 text-sm max-w-md">Tidak ada lagi tagihan tertunggak pada karung pengiriman ini.</p>
            </div>
          )}

          {/* DOOMSDAY VOID BUTTON (Tampil kapan saja selama bukan dibatalkan) */}
          {shipment.shipment_status_code !== 'CANCELLED' && (
             <div className="mt-8 border-t border-red-100 pt-6">
                <button 
                  onClick={() => setDoomVoidOpen(true)}
                  className="w-full py-4 border-2 border-red-200 text-red-600 font-black tracking-widest rounded-xl hover:bg-red-50 transition-colors uppercase text-sm flex items-center justify-center gap-2"
                >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   Void Seluruh Transaksi & Bongkar Karung
                </button>
             </div>
          )}
       </div>

       {/* PANEL KANAN: Riwayat Pembayaran */}
       <div className="w-full lg:w-1/2 flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-white">
             <h3 className="font-black text-slate-800 text-sm tracking-wide flex items-center gap-2">
                 📋 REKAM JEJAK PEMBAYARAN
             </h3>
          </div>
          <div className="p-4 space-y-3">
             {payments.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center opacity-50">
                    <span className="text-4xl grayscale mb-2">🤐</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Belum ada cicilan masuk</span>
                </div>
             ) : (
                payments.map(pay => (
                   <div key={pay.id} className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-2 shadow-sm hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start">
                         <span className="font-black text-slate-800 text-lg">{formatIdr(Number(pay.amount))}</span>
                         <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded truncate max-w-[120px]">
                           {pay.method_name}
                         </span>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                         <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-0.5">Waktu Transaksi</span>
                            <span className="text-xs font-medium text-slate-600">{new Date(pay.paid_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                         </div>
                          {(pay.paid_to || pay.payment_reference) && (
                           <div className="text-[10px] text-right text-slate-400 max-w-[150px] truncate" title={`${pay.paid_to} - ${pay.payment_reference}`}>
                              Kasir: <span className="font-bold text-slate-600">{pay.paid_to || '-'}</span> <br/>
                              Ref: <span className="font-bold text-slate-600 truncate">{pay.payment_reference || '-'}</span>
                           </div>
                         )}
                      </div>
                      
                      {/* Tombol Void Kasir (Kecil di Pojok Bawah) */}
                      <div className="border-t border-slate-100 pt-2 mt-1 flex justify-end">
                         <button 
                            type="button"
                            onClick={() => setVoidTarget({id: pay.id, amount: formatIdr(Number(pay.amount))})}
                            className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded"
                         >
                            Batalkan Cicilan Ini
                         </button>
                      </div>
                   </div>
                ))
             )}
          </div>
       </div>

       {/* MODAL VOID CICILAN */}
       {voidTarget && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 bg-red-50 border-b border-red-100 flex items-center gap-4">
                <span className="text-4xl">🚨</span>
                <div>
                   <h3 className="font-black text-red-800 tracking-tight">Void Pembayaran</h3>
                   <p className="text-xs font-medium text-red-600 mt-0.5">Penarikan dicatat ke audit log.</p>
                </div>
             </div>
             <form onSubmit={handleVoidPayment} className="p-6">
                <input type="hidden" name="payment_id" value={voidTarget.id} />
                <p className="text-sm font-medium text-slate-600 mb-4">
                   Anda akan menghapus riwayat cicilan sebesar <span className="font-black text-slate-800 bg-slate-100 px-1 rounded">{voidTarget.amount}</span>.
                </p>
                <div className="mb-6">
                   <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 block">
                      Alasan Void (Wajib Diisi)
                   </label>
                   <textarea 
                     name="reason" 
                     required 
                     rows={3} 
                     placeholder="Contoh: Salah ketik angka masuk, setoran batal..."
                     className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                   />
                </div>
                <div className="flex gap-3">
                   <button 
                     type="button" 
                     onClick={() => setVoidTarget(null)}
                     disabled={isPending}
                     className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
                   >
                     Batal
                   </button>
                   <button 
                     type="submit" 
                     disabled={isPending}
                     className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-[0_4px_12px_rgb(220,38,38,0.3)] disabled:opacity-50"
                   >
                     {isPending ? 'Memproses...' : 'Tarik Uang'}
                   </button>
                </div>
             </form>
           </div>
         </div>
       )}

       {/* MODAL DOOMSDAY VOID TRANSAKSI KESELURUHAN */}
       {doomVoidOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6 bg-red-600 text-white flex items-center gap-4">
                <span className="text-4xl">🧨</span>
                <div>
                   <h3 className="font-black text-xl tracking-tight">Void Keseluruhan Transaksi</h3>
                   <p className="text-xs font-medium text-red-200 mt-0.5">Operasi logistik akan digugurkan.</p>
                </div>
             </div>
             <form onSubmit={handleDoomVoid} className="p-6">
                <input type="hidden" name="shipment_id" value={shipment.id} />
                <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm font-medium mb-6">
                   <strong className="block mb-1">Peringatan Keras:</strong>
                   Tindakan ini akan mengosongkan status tagihan, memutus ikatan Resi/Karung dari Manifes (<span className="font-mono text-xs text-red-600">batch_id = NULL</span>), dan melepeh kemasan paket kembali ke gudang awal (<span className="font-mono text-xs text-red-600">RECEIVED_AT_HUB</span>).
                </div>
                <div className="mb-6">
                   <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 block">
                      Alasan Pembongkaran / Void Transaksi
                   </label>
                   <textarea 
                     name="reason" 
                     required 
                     rows={3} 
                     placeholder="Contoh: Transaksi batal karena barang harus dibongkar, atau Refund mutlak..."
                     className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                   />
                </div>
                <div className="flex gap-3">
                   <button 
                     type="button" 
                     onClick={() => setDoomVoidOpen(false)}
                     disabled={isPending}
                     className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                   >
                     Tutup
                   </button>
                   <button 
                     type="submit" 
                     disabled={isPending}
                     className="w-2/3 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-[0_4px_12px_rgb(220,38,38,0.3)] disabled:opacity-50 transition-all uppercase tracking-wider"
                   >
                     {isPending ? 'Mengeksekusi...' : 'HANCURKAN & VOID'}
                   </button>
                </div>
             </form>
           </div>
         </div>
       )}
       
    </div>
  )
}
