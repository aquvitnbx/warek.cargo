import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const customerId = resolvedParams.id;
  
  let customer: any = null;
  let packages: any[] = [];
  let dbError: string | null = null;
  
  try {
     // Fetch Customer
     const resCust = await pool.query(`
        SELECT * FROM customers WHERE id = $1
     `, [customerId]);
     customer = resCust.rows[0];

     if (customer) {
       // Fetch Packages that belong to this customer
       const resPkg = await pool.query(`
          SELECT p.id, p.tracking_number, p.received_at, p.customer_declared_at, p.created_at, p.package_status_code, p.item_description, p.quantity, h.code as hub_code
          FROM inbound_packages p
          LEFT JOIN hubs h ON p.hub_id = h.id
          WHERE p.customer_id = $1
          ORDER BY COALESCE(p.received_at, p.customer_declared_at, p.created_at) DESC
       `, [customerId]);
       packages = resPkg.rows;
     }

  } catch (err: any) {
     dbError = err.message || "Gagal mengambil data dari Database.";
  }

  if (!customer && !dbError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
         <span className="text-6xl mb-4">👻</span>
         <h2 className="text-2xl font-black text-slate-800">Customer Tidak Ditemukan</h2>
         <p className="text-slate-500 mt-2 mb-6">Mungkin ID tidak valid atau telah dihapus.</p>
         <Link href="/customers" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Kembali ke Daftar</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       {/* Breadcrumbs & Header */}
       <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
         <div>
            <Link href="/customers" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </Link>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
               📱 {customer?.full_name}
            </h2>
            <div className="mt-2 flex gap-3 text-sm font-medium">
              <span className="text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">ID: {customer?.customer_code || customer?.id.split('-')[0]}</span>
              <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${customer?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                 {customer?.is_active ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
         </div>
         <div className="flex gap-2">
           <button className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all shadow-sm">
             Edit Profil
           </button>
           <a href={`https://wa.me/${customer?.whatsapp_number?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-[0_4px_10px_rgb(16,185,129,0.3)] transition-all flex items-center gap-2">
             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
             Chat WA
           </a>
         </div>
       </div>

       {dbError && (
         <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center gap-4 text-red-700 shadow-sm">
            <span className="text-3xl">📡</span><div><h4 className="font-bold tracking-tight">Koneksi Error</h4><p className="text-sm">{dbError}</p></div>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kolom Kiri: Profil */}
          <div className="md:col-span-1 border border-slate-200 bg-white shadow-sm rounded-2xl p-6">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Biodata & Kontak</h3>
             
             <div className="space-y-5">
               <div>
                 <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">WhatsApp</label>
                 <div className="font-mono font-black text-slate-800 text-lg">{customer?.whatsapp_number}</div>
               </div>
               
               <div>
                 <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Tujuan Utama (Kota)</label>
                 <div className="font-bold text-slate-800">{customer?.destination_city}</div>
                 {customer?.destination_district && <div className="text-sm font-medium text-slate-500 mt-1">Kec: {customer.destination_district}</div>}
               </div>

               <div>
                 <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Alamat Lengkap</label>
                 <div className="text-sm font-medium text-slate-600 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {customer?.address || 'Belum ada alamat spesifik'}
                 </div>
               </div>
               
               <div>
                 <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Catatan Operasional</label>
                 <div className="text-sm font-medium text-slate-600 mt-1">
                    {customer?.notes || '-'}
                 </div>
               </div>
             </div>
          </div>

          {/* Kolom Kanan: History Paket */}
          <div className="md:col-span-2 border border-slate-200 bg-white shadow-sm rounded-2xl flex flex-col overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Riwayat Paket ({packages.length})</h3>
               <button className="text-xs font-bold text-blue-600 hover:text-blue-800">
                  + Tautkan Paket Nyasar
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold tracking-widest uppercase border-b border-slate-100">
                     <tr>
                        <th className="px-6 py-4">Resi</th>
                        <th className="px-6 py-4">Hub & Waktu</th>
                        <th className="px-6 py-4">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {packages.map((pkg: any) => (
                        <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="font-mono text-blue-600 font-bold">{pkg.tracking_number}</div>
                              <div className="text-xs font-medium text-slate-400 mt-0.5 truncate max-w-[150px]">{pkg.item_description || 'Isi tidak diketahui'}</div>
                           </td>
                           <td className="px-6 py-4">
                              <div className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px] inline-block mb-1">{pkg.hub_code}</div>
                              <div className="text-xs font-medium text-slate-400">
                                 {new Date(pkg.received_at || pkg.customer_declared_at || pkg.created_at).toLocaleDateString('id-ID')}
                                 {!pkg.received_at && <span className="block text-[9px] text-indigo-400 font-bold uppercase mt-0.5">Pre-Manifest</span>}
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-200">
                                {pkg.package_status_code}
                              </span>
                           </td>
                        </tr>
                     ))}
                     
                     {packages.length === 0 && (
                        <tr>
                           <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                              Belum ada riwayat paket untuk customer ini.
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
             </div>
          </div>
       </div>
    </div>
  )
}
