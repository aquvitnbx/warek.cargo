'use client';

import { useState, useRef } from 'react';
import TrackingInputWithScanner from './TrackingInputWithScanner';
import { submitIncomingPackage } from '@/app/intake/actions';

interface IntakeFormProps {
  hubs: { code: string; name: string }[];
  statuses: { code: string; name: string }[];
  customers?: { id: string; full_name: string; whatsapp_number: string; customer_code?: string }[];
}

export default function IntakeForm({ hubs, statuses, customers = [] }: IntakeFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Use a key to force re-mount the TrackingInput component after submit
  // so it resets its internal value and triggers autoFocus again
  const [scanKey, setScanKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent full page reload & drop-down reset
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Prevent double submission
    if (isPending) return;
    
    setIsPending(true);
    setFeedback(null);

    try {
      const result = await submitIncomingPackage(formData);
      
      if (result.success) {
        setFeedback({ type: 'success', message: result.message });
        // Only clear the tracking number & description, keep Hub and Status drop-downs
        // Also keep quantity and sender for fast repeated scans from the same sender if needed
        const qtyField = form.elements.namedItem('quantity') as HTMLInputElement;
        const senderField = form.elements.namedItem('sender_name') as HTMLInputElement;
        
        // Reset the tracker input component by incrementing key
        setScanKey(k => k + 1);
        
        // Brief success feedback duration
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', message: result.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan sistem' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-white p-7 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative">
      
      {/* Feedback Overlay indicating Loading */}
      {isPending && (
         <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-[2rem]">
            <div className="bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-bold uppercase tracking-widest text-sm animate-pulse">
               <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Memproses Scan...
            </div>
         </div>
      )}

      {/* Success/Error Feedback Banner */}
      {feedback && !isPending && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 ${
           feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className={`mt-0.5 rounded-full p-1 ${feedback.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
             {feedback.type === 'success' ? (
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
             ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
             )}
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-wide">{feedback.type === 'success' ? 'BERHASIL' : 'GAGAL'}</h4>
            <p className="text-sm font-medium opacity-80 mt-0.5">{feedback.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* HUB & STATUS */}
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Lokasi Pangkalan</label>
             <select name="hub_id" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer">
               {hubs.map((h: any) => (
                 <option key={h.code} value={h.code}>{h.name}</option>
               ))}
             </select>
           </div>
           <div>
             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Kondisi Paket</label>
             <select name="package_status_code" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none cursor-pointer">
               {statuses.map((s: any) => (
                 <option key={s.code} value={s.code}>{s.name}</option>
               ))}
             </select>
           </div>
        </div>

        {/* CUSTOMER ASSIGNMENT */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pelanggan Pemilik (Assign Customer)</label>
          <select name="customer_id" className="w-full p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer">
            <option value="">-- Assign Later / Unidentified (Kosong) --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} {c.customer_code ? `[${c.customer_code}]` : ''} - {c.whatsapp_number}
              </option>
            ))}
          </select>
        </div>

        {/* TRACKING NUMBER DENGAN SCANNER BLUETOOTH FOCUS */}
        {/* Menggunakan scanKey agar setiap submit sukses, input ini dibuat ulang, isinya kosong, dan autofocus terpicu kembali */}
        <TrackingInputWithScanner key={`scanner-${scanKey}`} isPending={isPending} />

        {/* SENDER & QUANTITY */}
        <div className="grid grid-cols-3 gap-4">
           <div className="col-span-2">
             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Kurir / Pengirim Asal (Opsional)</label>
             <input 
               type="text" 
               name="sender_name" 
               placeholder="JNE, Seller Tokopedia..." 
               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
             />
           </div>
           <div>
             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quantity (Koli)</label>
             <input 
               type="number" 
               name="quantity" 
               defaultValue="1"
               min="1"
               required
               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-sm text-slate-800 font-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
             />
           </div>
        </div>

        {/* DESKRIPSI FISIK (Jika key berubah, area ini tidak akan terhapus karena diluar TrackingInput, namun idealnya ini dibersihkan setiap scan. Kita bisa clean DOM via Form jika mau, tapi user mungkin butuh deskripsi yg sama buat sisa batch. Kita biarkan persisten untuk efisiensi gudang.) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Deskripsi Barang (Opsional)</label>
          <textarea 
            name="item_description" 
            placeholder="Kardus warna coklat, ukuran besar, butuh repack..."
            rows={2}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none"
          ></textarea>
        </div>

        {/* UPLOAD FOTO (Sesuai rencana, tetap dibiarkan untuk opsional/kasus rusak) */}
        <div className="p-4 bg-blue-50/50 border border-blue-200 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors group relative overflow-hidden">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-black text-blue-800 tracking-tight">Lampirkan Foto Paket (Opsional)</span>
                <span className="text-[10px] text-blue-500 font-medium">Klik jika kondisi barang perlu didokumentasikan</span>
             </div>
          </div>
          <input type="file" name="file-upload" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>

        {/* SUBMIT */}
        <button 
          type="submit" 
          disabled={isPending}
          className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black rounded-2xl shadow-[0_8px_20px_rgb(37,99,235,0.2)] active:scale-[0.98] disabled:active:scale-100 disabled:cursor-not-allowed transition-all outline-none text-lg tracking-wider"
        >
          {isPending ? 'MENYIMPAN...' : 'PROSES PAKET SEKARANG'}
        </button>
      </form>

    </div>
  );
}
