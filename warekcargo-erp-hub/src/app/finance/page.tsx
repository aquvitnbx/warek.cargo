import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function FinanceDashboard() {
  let shipments = [];
  let dbError = null;

  try {
    const query = `
      SELECT 
         s.id,
         s.shipment_code,
         s.payment_status_code,
         s.final_charge_amount,
         s.amount_paid,
         s.total_weight_kg,
         s.total_volume_m3,
         c.full_name,
         c.whatsapp_number
      FROM customer_shipments s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.total_weight_kg IS NOT NULL 
        AND s.total_weight_kg > 0
      ORDER BY 
         CASE s.payment_status_code 
            WHEN 'PENDING' THEN 1
            WHEN 'PARTIAL' THEN 2
            WHEN 'PAID' THEN 3
            ELSE 4
         END,
         s.updated_at DESC
    `;
    const res = await pool.query(query);
    shipments = res.rows;
  } catch (err: any) {
    dbError = err.message || "Gagal terkoneksi ke Database.";
  }

  // Format IDR helper
  const formatIdr = (num: number) => {
     if (!num) return 'Rp 0';
     return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
               💳 Kasir & Tagihan
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Tetapkan perhitungan biaya akhir dan catat penerimaan uang atas karung pengiriman.</p>
         </div>
      </div>

      {dbError && (
         <div className="bg-red-50 border border-red-200 p-5 rounded-2xl text-red-700 shadow-sm text-sm font-bold">
            Data gagal diambil: {dbError}
         </div>
      )}

      {/* RANGKUMAN */}
      <div className="grid grid-cols-3 gap-4">
         <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20">
            <h4 className="text-blue-200 font-bold text-xs uppercase tracking-widest mb-1">Piutang Menggantung</h4>
            <div className="text-3xl font-black">{shipments.filter(s => s.payment_status_code !== 'PAID').length}</div>
            <div className="text-xs text-blue-300 mt-2">Karung Menunggu Lunas</div>
         </div>
         <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
            <h4 className="text-emerald-100 font-bold text-xs uppercase tracking-widest mb-1">Omset Lunas (Kas)</h4>
            <div className="text-2xl font-black mt-1">
               {formatIdr(shipments.reduce((acc, curr) => acc + Number(curr.amount_paid || 0), 0))}
            </div>
         </div>
      </div>

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                  <tr>
                     <th className="p-4">Pelanggan</th>
                     <th className="p-4">Kode Karung</th>
                     <th className="p-4">Dimensi Fisik</th>
                     <th className="p-4">Tagihan Final</th>
                     <th className="p-4">Terbayar</th>
                     <th className="p-4 text-center">Status</th>
                     <th className="p-4 text-right">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {shipments.map((shp: any) => {
                     const bill = shp.final_charge_amount ? Number(shp.final_charge_amount) : 0;
                     const paid = Number(shp.amount_paid || 0);

                     let statusColor = "bg-slate-100 text-slate-600";
                     if (shp.payment_status_code === 'PAID') statusColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                     else if (shp.payment_status_code === 'PARTIAL') statusColor = "bg-blue-100 text-blue-800 border-blue-200";
                     else if (shp.payment_status_code === 'PENDING') statusColor = "bg-amber-100 text-amber-800 border-amber-200";

                     return (
                        <tr key={shp.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="p-4">
                              <div className="font-bold text-slate-800">{shp.full_name}</div>
                              <div className="font-mono text-xs text-slate-400">{shp.whatsapp_number}</div>
                           </td>
                           <td className="p-4">
                              <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{shp.shipment_code}</span>
                           </td>
                           <td className="p-4 text-slate-500 font-medium text-xs">
                              {shp.total_weight_kg} kg <br/> {shp.total_volume_m3} m³
                           </td>
                           <td className="p-4 font-black text-slate-700">
                              {bill > 0 ? formatIdr(bill) : <span className="text-slate-400 italic font-medium">Belum Ditetapkan</span>}
                           </td>
                           <td className="p-4 font-bold text-blue-600">
                              {paid > 0 ? formatIdr(paid) : '-'}
                           </td>
                           <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 border text-[10px] font-bold tracking-widest uppercase rounded ${statusColor}`}>
                                 {shp.payment_status_code}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              <Link href={`/finance/${shp.id}`} className="px-4 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors">
                                 Buka Kasir
                              </Link>
                           </td>
                        </tr>
                     )
                  })}
                  {shipments.length === 0 && (
                     <tr>
                        <td colSpan={7} className="p-10 text-center text-slate-500 font-medium">
                           Tidak ada data karung yang sudah ditimbang dan siap ditagih.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
