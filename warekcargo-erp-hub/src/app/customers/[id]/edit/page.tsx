import pool from '@/lib/db';
import Link from 'next/link';
import { updateCustomer } from '@/app/customers/actions';

export const revalidate = 0;

type CustomerDetail = {
  id: string;
  full_name: string;
  whatsapp_number: string | null;
  destination_city: string | null;
  destination_district: string | null;
  address: string | null;
  notes: string | null;
};

export default async function CustomerEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let customer: CustomerDetail | null = null;
  let dbError: string | null = null;

  try {
     const resCust = await pool.query(`SELECT * FROM customers WHERE id = $1`, [id]);
     customer = resCust.rows[0];
  } catch (err: unknown) {
     dbError = err instanceof Error ? err.message : 'Gagal terkoneksi ke Database.';
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
         <h2 className="text-2xl font-black text-slate-800">Customer Tidak Ditemukan</h2>
         <Link href="/customers" className="px-6 py-3 mt-4 bg-slate-900 text-white rounded-xl font-bold">Kembali ke Daftar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 animate-in fade-in pb-12">
       <div>
          <Link href={`/customers/${id}`} className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Profil Pelanggan
          </Link>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">
             Edit Profil Pelanggan
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-2">
             Ubah data kontak dan informasi destinasi utama untuk <span className="font-bold text-slate-700">{customer.full_name}</span>.
          </p>
       </div>

       {dbError && (
         <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-bold shadow-sm">
            🚨 Koneksi Error: {dbError}
         </div>
       )}

       {!dbError && (
          <form action={async (formData) => {
             'use server';
             await updateCustomer(formData);
          }} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
             <input type="hidden" name="id" value={customer.id} />
             
             <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Nama Lengkap Pemilik Barang</label>
                  <input type="text" name="full_name" defaultValue={customer.full_name} required placeholder="Contoh: Budi Santoso" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Nomor WhatsApp Aktif</label>
                  <input type="tel" name="whatsapp_number" defaultValue={customer.whatsapp_number ?? ''} required placeholder="Contoh: 081234567890" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <p className="text-xs text-slate-400 mt-1.5 font-medium">Nomor ini akan digunakan untuk notifikasi resi dan tagihan secara otomatis.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Kota Tujuan Reguler</label>
                     <input type="text" name="destination_city" defaultValue={customer.destination_city || 'Nabire'} placeholder="Contoh: Nabire" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800" />
                   </div>
                   <div>
                     <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Daerah Detail (Opsional)</label>
                     <input type="text" name="destination_district" defaultValue={customer.destination_district ?? ''} placeholder="Kecamatan/Desa" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800" />
                   </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Alamat Pengiriman Default (Opsional)</label>
                  <textarea name="address" defaultValue={customer.address ?? ''} rows={3} placeholder="Jalan, RT/RW, Patokan..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Catatan Operasional Internal (Opsional)</label>
                  <textarea name="notes" defaultValue={customer.notes ?? ''} rows={2} placeholder="Sering kirim barang rapuh, dsb..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
             </div>

             <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <Link href={`/customers/${id}`} className="px-6 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                   Batal
                </Link>
                <button type="submit" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black tracking-widest rounded-xl transition-transform active:scale-95 shadow-[0_4px_12px_rgb(37,99,235,0.3)] uppercase">
                   Simpan Perubahan
                </button>
             </div>
          </form>
       )}
    </div>
  );
}
