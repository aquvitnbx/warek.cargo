import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function ConsolidationDashboard() {
  let customerGroups = [];
  let dbError = null;

  try {
    const query = `
      SELECT 
        c.id as customer_id,
        c.full_name,
        c.whatsapp_number,
        c.destination_city,
        COUNT(p.id) as pending_packages
      FROM inbound_packages p
      JOIN customers c ON p.customer_id = c.id
      LEFT JOIN shipment_packages sp ON p.id = sp.inbound_package_id
      WHERE sp.shipment_id IS NULL
        AND p.package_status_code IN ('RECEIVED_AT_HUB', 'REPACKING')
      GROUP BY c.id
      ORDER BY pending_packages DESC
    `;
    const res = await pool.query(query);
    customerGroups = res.rows;
  } catch (err: any) {
    dbError = err.message || "Gagal terkoneksi ke sistem Database.";
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <Link href="/" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </Link>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
               📦 Antrean Konsolidasi
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Bungkus paket milik pelanggan ke dalam satu kesatuan Karung (Shipment).</p>
         </div>
      </div>

      {dbError && (
         <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-center gap-4 text-red-700 shadow-sm">
            <span className="text-3xl">📡</span>
            <div>
              <h4 className="font-bold tracking-tight">Koneksi Error</h4>
              <p className="text-sm font-medium mt-1">{dbError}</p>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customerGroups.map((grp: any) => (
          <Link href={`/consolidation/customer/${grp.customer_id}`} key={grp.customer_id} className="block group">
             <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-4">
                     <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-black tracking-widest rounded-full shadow-sm">
                       {grp.pending_packages} PAKET
                     </span>
                     <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{grp.destination_city}</span>
                   </div>
                   <h3 className="font-black text-xl text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                     {grp.full_name}
                   </h3>
                   <p className="text-slate-500 font-mono text-sm">{grp.whatsapp_number}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-bold text-sm">
                   Buat Shipment 
                   <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                   </svg>
                </div>
             </div>
          </Link>
        ))}

        {customerGroups.length === 0 && !dbError && (
          <div className="col-span-full bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center">
             <span className="text-5xl opacity-30 grayscale mb-4">🏝️</span>
             <h3 className="text-slate-500 font-black tracking-widest uppercase text-sm">Antrean Bersih</h3>
             <p className="text-slate-400 mt-2 text-sm max-w-md">Tidak ada pelanggan yang memiliki tumpukan paket nganggur. Lakukan Intake Resi baru untuk memunculkan antrean.</p>
          </div>
        )}
      </div>

    </div>
  );
}
