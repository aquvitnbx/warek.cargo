'use client';

import { useState, useRef } from 'react';
import TrackingInputWithScanner from './TrackingInputWithScanner';
import { submitIncomingPackage, createCustomerInline } from '@/app/intake/actions';

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

  // Quick Add Customer State
  const [customerList, setCustomerList] = useState(customers);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

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

  const handleQuickAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     setIsAddingCustomer(true);
     const form = e.currentTarget;
     const formData = new FormData(form);

     try {
        const result = await createCustomerInline(formData);
        if (result.success && result.data) {
           setCustomerList(prev => [result.data, ...prev]);
           setSelectedCustomerId(result.data.id);
           setShowCustomerModal(false);
           // Show success toast on main feedback? Maybe not necessary, just close modal.
        } else {
           alert(result.message || 'Gagal membuat pelanggan.');
        }
     } catch (err: any) {
        alert(err.message || 'Error koneksi.');
     } finally {
        setIsAddingCustomer(false);
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
          <div className="flex justify-between items-center mb-2">
             <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pelanggan Pemilik (Assign Customer)</label>
             <button type="button" onClick={() => setShowCustomerModal(true)} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors uppercase tracking-widest">
                + Customer Baru
             </button>
          </div>
          <select 
            name="customer_id" 
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">-- Assign Later / Unidentified (Kosong) --</option>
            {customerList.map((c) => (
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

      {/* MODAL QUICK ADD CUSTOMER */}
      {showCustomerModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-black text-slate-800 tracking-wide flex items-center gap-2">
                     <span className="text-xl">👤</span> Tambah Pelanggan
                  </h3>
                  <button type="button" onClick={() => setShowCustomerModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                     ✕
                  </button>
               </div>
               <form onSubmit={handleQuickAddCustomer} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Nama Lengkap</label>
                    <input type="text" name="full_name" required autoFocus placeholder="Budi Santoso" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Nomor WhatsApp</label>
                    <div className="flex bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
                      <span className="p-3 bg-slate-100 text-slate-500 font-bold border-r border-slate-200">62</span>
                      <input type="tel" name="whatsapp_number" required placeholder="81234567890" className="w-full p-3 bg-transparent font-bold text-slate-800 focus:outline-none placeholder-slate-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Kota Tujuan</label>
                    <input type="text" name="destination_city" defaultValue="Nabire" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                     <button type="button" onClick={() => setShowCustomerModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                        Batal
                     </button>
                     <button type="submit" disabled={isAddingCustomer} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl transition-colors">
                        {isAddingCustomer ? 'SIMPAN...' : 'SIMPAN'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
}
