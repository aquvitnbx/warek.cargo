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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Data Manifest</span>
            </h2>
            <p className="text-slate-400 mt-2 text-sm font-medium">Lacak jejak masuk 50 kargo terakhir di pangkalan hub.</p>
         </div>
       </div>

       <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-transparent opacity-30"></div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-widest border-b border-white/10">
                 <tr>
                   <th className="p-5 font-bold">Trace ID</th>
                   <th className="p-5 font-bold">Sektor</th>
                   <th className="p-5 font-bold">Timestamp</th>
                   <th className="p-5 font-bold">Status Induk</th>
                   <th className="p-5 font-bold">Keterangan Tambahan</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {packages.map((pkg: any) => (
                  <tr key={pkg.tracking_number} className="hover:bg-white/5 transition-colors group cursor-default">
                    <td className="p-5 font-mono neon-text-cyan">{pkg.tracking_number}</td>
                    <td className="p-5">
                       <span className="px-3 py-1 bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-slate-300">
                         {pkg.hub_code}
                       </span>
                    </td>
                    <td className="p-5 text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                       {new Date(pkg.received_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-5">
                       <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                         {pkg.package_status_code}
                       </span>
                    </td>
                    <td className="p-5 text-slate-400 truncate max-w-[200px] font-medium group-hover:text-slate-200">
                       {pkg.item_description || '-'}
                    </td>
                  </tr>
                ))}
                
                {packages.length === 0 && (
                  <tr>
                     <td colSpan={5} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-4xl opacity-30 drop-shadow-[0_0_10px_rgba(255,255,255,1)]">📭</span>
                          <span className="text-slate-500 font-bold tracking-widest uppercase text-xs">Kosong. Belum ada entri paket.</span>
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
