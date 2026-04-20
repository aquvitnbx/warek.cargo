'use client';

import Link from 'next/link';
import { createCustomer } from '../actions';
import { useState } from 'react';

export default function NewCustomerPage() {
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError('');
    setIsPending(true);
    const result = await createCustomer(formData);
    
    // Server action will redirect on success. 
    // If we reach here, it might be an error.
    if (result && result.success === false) {
      setError(result.message);
      setIsPending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div>
          <Link href="/customers" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Batal & Kembali
          </Link>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">
             Tambah Pelanggan Baru
          </h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Lengkapi biodata awal untuk tracking dan notifikasi via WhatsApp.</p>
       </div>

       {error && (
         <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold shadow-sm">
            🚨 {error}
         </div>
       )}

       <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
         <form action={onSubmit} className="space-y-6">
            
            <div>
               <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Nama Lengkap</label>
               <input 
                 type="text" 
                 name="full_name" 
                 required
                 placeholder="Bpk. Habib Nabire..." 
                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder-slate-300"
               />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Nomor WhatsApp</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none font-bold text-slate-400">+62</div>
                   <input 
                     type="tel" 
                     name="whatsapp_number" 
                     required
                     placeholder="812xxxxx" 
                     className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder-slate-300"
                   />
                 </div>
              </div>
              
              <div>
                 <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Kota Destinasi</label>
                 <select 
                   name="destination_city" 
                   className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold appearance-none"
                 >
                   <option value="Nabire">Nabire</option>
                   <option value="Manokwari">Manokwari</option>
                   <option value="Sorong">Sorong</option>
                   <option value="Jayapura">Jayapura</option>
                 </select>
              </div>
            </div>

            <div>
               <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Alamat Lengkap (Opsional)</label>
               <textarea 
                 name="address" 
                 rows={3}
                 placeholder="Jalan Kesuma Bangsa No..." 
                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none placeholder-slate-300"
               />
            </div>

            <div>
               <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Catatan Internal (Opsional)</label>
               <input 
                 type="text" 
                 name="notes" 
                 placeholder="Contoh: Langganan bos besar, khusus repacking tebal." 
                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium placeholder-slate-300"
               />
            </div>

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black tracking-widest rounded-xl shadow-[0_8px_20px_rgb(37,99,235,0.2)] active:scale-[0.98] transition-all"
            >
              {isPending ? 'MENYIMPAN...' : 'SIMPAN DATA PELANGGAN'}
            </button>

         </form>
       </div>
    </div>
  )
}
