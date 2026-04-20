import pool from '@/lib/db';

export const revalidate = 0;

export default async function PackagesList() {
  let packages = [];
  try {
     const res = await pool.query(`
        SELECT p.tracking_number, p.received_at, p.package_status_code, h.code as hub_code, p.item_description
        FROM inbound_packages p
        LEFT JOIN hubs h ON p.hub_id = h.id
        ORDER BY p.received_at DESC
        LIMIT 50
     `);
     packages = res.rows;
  } catch (err) {
     console.error("Packages fetch err:", err);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
               📋 Data Manifest Paket
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Melacak 50 masuk dan pergerakan logistik terakhir di pangkalan Hub Utama.</p>
         </div>
       </div>

       <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200">
                 <tr>
                   <th className="p-5 font-bold tracking-widest uppercase">Trace ID (Resi)</th>
                   <th className="p-5 font-bold tracking-widest uppercase">Sektor</th>
                   <th className="p-5 font-bold tracking-widest uppercase">Timestamp</th>
                   <th className="p-5 font-bold tracking-widest uppercase">Status Operasi Induk</th>
                   <th className="p-5 font-bold tracking-widest uppercase">Keterangan Administrasi</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.map((pkg: any) => (
                  <tr key={pkg.tracking_number} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-mono text-blue-600 font-bold">{pkg.tracking_number}</td>
                    <td className="p-5">
                       <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                         {pkg.hub_code}
                       </span>
                    </td>
                    <td className="p-5 text-slate-600 font-medium">
                       {new Date(pkg.received_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-5">
                       <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-200">
                         {pkg.package_status_code}
                       </span>
                    </td>
                    <td className="p-5 text-slate-500 truncate max-w-[200px] font-medium">
                       {pkg.item_description || '-'}
                    </td>
                  </tr>
                ))}
                
                {packages.length === 0 && (
                  <tr>
                     <td colSpan={5} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-4xl opacity-50 grayscale">📭</span>
                          <span className="text-slate-500 font-bold tracking-widest uppercase text-xs">Aman. Belum ada entri paket hari ini.</span>
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
