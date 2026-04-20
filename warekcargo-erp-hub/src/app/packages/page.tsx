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
       <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Daftar Paket di Hub</h2>
          <p className="text-slate-500 mt-2 text-sm">Menampilkan 50 paket terkini yang sedang melintas atau tertahan di gudang.</p>
       </div>

       <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-wider">
                 <tr>
                   <th className="p-5 font-bold">Resi Tracking</th>
                   <th className="p-5 font-bold">Asal Hub</th>
                   <th className="p-5 font-bold">Waktu Scan</th>
                   <th className="p-5 font-bold">Status Induk</th>
                   <th className="p-5 font-bold">Deskripsi Tambahan</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {packages.map((pkg: any) => (
                  <tr key={pkg.tracking_number} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 font-mono text-indigo-600 font-bold">{pkg.tracking_number}</td>
                    <td className="p-5">
                       <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                         {pkg.hub_code}
                       </span>
                    </td>
                    <td className="p-5 text-slate-500 font-medium">
                       {new Date(pkg.received_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-5">
                       <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold">
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
                          <span className="text-4xl grayscale opacity-50">📭</span>
                          <span className="text-slate-400 font-bold">Belum ada paket yang dipindai di tabel inbound_packages.</span>
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
