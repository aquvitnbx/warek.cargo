import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function ArrivalDashboardPage() {
  let batches: any[] = [];
  let dbError = null;

  try {
     const res = await pool.query(`
        SELECT 
           b.id, b.batch_code, b.batch_status_code, b.transport_mode_code,
           b.vessel_name, b.voyage_number, b.destination_city, b.etd_at,
           h.name as origin_hub_name,
           (SELECT COUNT(*) FROM customer_shipments s WHERE s.batch_id = b.id) as total_shipments
        FROM shipping_batches b
        LEFT JOIN hubs h ON b.hub_id = h.id
        WHERE b.batch_status_code IN ('DEPARTED', 'ARRIVED', 'COMPLETED')
        ORDER BY 
           CASE WHEN b.batch_status_code = 'DEPARTED' THEN 1 ELSE 2 END,
           b.etd_at ASC
     `);
     batches = res.rows;
  } catch (err: any) {
     dbError = err.message || "Gagal terkoneksi ke Database.";
  }

  const getStatusBadge = (status: string) => {
     switch(status) {
        case 'DEPARTED': return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold uppercase border border-blue-200">Sedang Berlayar</span>;
        case 'ARRIVED': return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold uppercase border border-amber-200">Tiba (Bongkar Muat)</span>;
        case 'COMPLETED': return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold uppercase border border-emerald-200">Bongkar Selesai</span>;
        default: return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold uppercase">{status}</span>;
     }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
            <span className="text-blue-600 p-2 bg-blue-50 rounded-2xl">⚓</span> 
            Penerimaan Kapal (Arrival)
          </h2>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl text-sm leading-relaxed">
            Monitor kedatangan manifest Kapal dari Pelabuhan Asal. Eksekusi proses Bongkar Muat (Unloading) secara massal agar karung otomatis diteruskan ke cabang operasional Delivery terdekat (Cth: Nabire, Sorong, dll).
          </p>
        </div>
      </div>

      {dbError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold shadow-sm">
           🚨 Koneksi Error: {dbError}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Kode Kapal / Batch</th>
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Rute / Pelayaran</th>
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Armada</th>
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Muatan Karung</th>
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Status Sandar</th>
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 font-medium text-sm">
                      <div className="text-4xl mb-2">🌊</div>
                      Belum ada jadwal Kapal yang berlayar (DEPARTED) menuju ke titik kedatangan.
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5">
                         <div className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded inline-block text-sm border border-indigo-100">
                           {batch.batch_code}
                         </div>
                      </td>
                      <td className="p-5">
                        <div className="font-bold text-slate-800 text-xs tracking-wider uppercase">{batch.origin_hub_name} ➔ <span className="text-blue-700">{batch.destination_city}</span></div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">ETD: {new Date(batch.etd_at).toLocaleDateString('id-ID')}</div>
                      </td>
                      <td className="p-5">
                        <div className="font-bold text-slate-800 text-sm">{batch.vessel_name || '(Tanpa Nama Kapal)'}</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Voyage: {batch.voyage_number || '-'} • Jalur: {batch.transport_mode_code}</div>
                      </td>
                      <td className="p-5">
                         <span className="font-black text-slate-700 text-lg">{batch.total_shipments} <span className="text-[10px] font-bold uppercase text-slate-400 align-middle">KARUNG</span></span>
                      </td>
                      <td className="p-5">
                         {getStatusBadge(batch.batch_status_code)}
                      </td>
                      <td className="p-5">
                         <Link 
                            href={`/arrival/${batch.id}`}
                            className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-all"
                         >
                            {batch.batch_status_code === 'DEPARTED' ? 'BONGKAR' : 'DETAIL'}
                         </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
