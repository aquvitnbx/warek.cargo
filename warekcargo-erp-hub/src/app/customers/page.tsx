import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function CustomersList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const resolvedParams = await searchParams;
  const q = resolvedParams?.q || '';
  
  let customers = [];
  let dbError: string | null = null;
  
  try {
     let query = `
        SELECT 
           c.id, c.customer_code, c.full_name, c.whatsapp_number, c.destination_city,
           COUNT(p.id) as package_count
        FROM customers c
        LEFT JOIN inbound_packages p ON p.customer_id = c.id
     `;
     
     const params: any[] = [];
     if (q) {
       query += ` WHERE c.full_name ILIKE $1 OR c.whatsapp_number ILIKE $1 OR c.customer_code ILIKE $1 `;
       params.push(`%${q}%`);
     }
     
     query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT 50`;

     const res = await pool.query(query, params);
     customers = res.rows;
  } catch (err: any) {
     dbError = err.message || "Gagal mengambil data dari Database Customers.";
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
               👥 Direktori Pelanggan
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Data sentral pelanggan Jastip/Kargo dan jejak paket milik mereka.</p>
         </div>
         <div className="flex gap-3">
           <form action="/customers" method="GET" className="flex items-center">
              <input 
                 type="text" 
                 name="q" 
                 defaultValue={q}
                 placeholder="Cari Nama/WA/Kode..." 
                 className="px-4 py-2 bg-white border border-slate-200 rounded-l-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium shadow-sm w-48 md:w-64"
              />
              <button type="submit" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold border border-l-0 border-slate-200 rounded-r-xl transition-colors">
                 Cari
              </button>
           </form>
           <Link href="/customers/new" className="px-5 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-[0_4px_10px_rgb(37,99,235,0.2)] transition-all">
             + Tambah Baru
           </Link>
         </div>
       </div>

       {dbError && (
         <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center gap-4 text-red-700 shadow-sm">
            <span className="text-3xl">📡</span>
            <div>
              <h4 className="font-bold tracking-tight">Koneksi Database Terputus</h4>
              <p className="text-sm font-medium mt-1">{dbError}</p>
            </div>
         </div>
       )}

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                 <tr>
                   <th className="p-5 font-bold tracking-widest uppercase">Kode</th>
                   <th className="p-5 font-bold tracking-widest uppercase">Nama Pelanggan</th>
                   <th className="p-5 font-bold tracking-widest uppercase">WhatsApp</th>
                   <th className="p-5 font-bold tracking-widest uppercase">Destinasi</th>
                   <th className="p-5 font-bold tracking-widest uppercase">Total Paket</th>
                   <th className="p-5 font-bold tracking-widest uppercase text-right">Aksi</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-mono text-slate-500 text-xs font-bold">{c.customer_code || '-'}</td>
                    <td className="p-5 font-bold text-slate-800">{c.full_name}</td>
                    <td className="p-5 font-mono text-emerald-600 font-bold">{c.whatsapp_number}</td>
                    <td className="p-5">
                       <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-[11px] font-bold border border-blue-100">
                         {c.destination_city}
                       </span>
                    </td>
                    <td className="p-5 font-bold text-slate-600">
                      {c.package_count} <span className="text-xs font-normal opacity-70">pcs</span>
                    </td>
                    <td className="p-5 text-right">
                       <Link href={`/customers/${c.id}`} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors">
                          Lihat Detail
                       </Link>
                    </td>
                  </tr>
                ))}
                
                {customers.length === 0 && !dbError && (
                  <tr>
                     <td colSpan={6} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-4xl opacity-50 grayscale">🔍</span>
                          <span className="text-slate-400 font-bold tracking-widest uppercase text-xs">Pencarian / Data Tidak Ditemukan.</span>
                        </div>
                     </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  )
}
