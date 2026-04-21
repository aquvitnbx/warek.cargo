'use client';

import { useState } from 'react';
import { setFinalCharge, addPayment } from '@/app/finance/actions';

interface CashierFormProps {
  shipment: any;
  payments: any[];
  paymentMethods: any[];
}

export default function CashierForm({ shipment, payments, paymentMethods }: CashierFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success'|'error', msg: string}|null>(null);

  const formatIdr = (num: number) => {
     if (!num) return 'Rp 0';
     return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const isFinalized = !!shipment.final_charge_amount;
  const bill = isFinalized ? Number(shipment.final_charge_amount) : 0;
  const paid = Number(shipment.amount_paid || 0);
  const isPaidOff = shipment.payment_status_code === 'PAID';
  const remaining = bill - paid;

  // Saran Estimasi Kasar:
  // Volume m3 * Rp 1.500.000 (1 kubik) atau Berat kg * Rp 15.000 
  // Ambil yang paling tinggi (Volume weight standard logic)
  const volEst = Number(shipment.total_volume_m3) * 1500000;
  const wgtEst = Number(shipment.total_weight_kg) * 15000;
  const standardEstimate = Math.max(volEst, wgtEst);

  const handleSetCharge = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsPending(true);
     setFeedback(null);
     const formData = new FormData(e.currentTarget);
     
     try {
       const res = await setFinalCharge(formData);
       if (res.success) setFeedback({ type: 'success', msg: 'Nilai tagihan final dikunci.' });
       else setFeedback({ type: 'error', msg: res.message });
     } catch (err: any) {
        setFeedback({ type: 'error', msg: err.message });
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
          setFeedback({ type: 'error', msg: res.message });
       }
     } catch (err: any) {
        setFeedback({ type: 'error', msg: err.message });
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
          {!isFinalized ? (
             <form onSubmit={handleSetCharge} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-black text-slate-800 text-sm tracking-wide border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                   <span>🔒 KUNCI TAGIHAN FINAL</span>
                   <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase">Tahap 1</span>
                </h3>
                
                <div className="bg-slate-50 p-4 border border-dashed border-slate-200 rounded-xl mb-4 text-center">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Estimasi Sistem (Tertinggi antara Vol & Berat)</p>
                   <p className="font-black text-xl text-slate-700 mt-1">{formatIdr(standardEstimate)}</p>
                </div>

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
                </div>

                <button 
                   type="submit" 
                   disabled={isPending}
                   className="w-full mt-4 py-4 bg-slate-800 hover:bg-black disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl transition-all"
                >
                   {isPending ? 'MEMPROSES...' : 'KUNCI TAGIHAN'}
                </button>
             </form>
          ) : (
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-4 -mt-4"></div>
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
                   </div>
                ))
             )}
          </div>
       </div>
       
    </div>
  )
}
