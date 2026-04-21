import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function DeliveryDashboardPage() {
  let shipments: any[] = [];
  let dbError = null;

  try {
    // Tarik target karung yang sudah di Nabire atau sedang dlm proses serah terima
    const res = await pool.query(`
      SELECT 
         s.id, s.shipment_code, s.payment_status_code, 
         s.shipment_status_code, s.pickup_delivery_status_code,
         c.full_name, c.whatsapp_number, c.destination_city
      FROM customer_shipments s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.shipment_status_code IN ('ARRIVED_DESTINATION', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED')
        AND s.pickup_delivery_status_code != 'DELIVERED' 
        AND s.pickup_delivery_status_code != 'PICKED_UP'
      ORDER BY s.updated_at DESC
      LIMIT 100
    `);
    
    // Juga tarik beberapa yang baru saja COMPLETED sebagai riwayat hari ini
    const resCompleted = await pool.query(`
      SELECT 
         s.id, s.shipment_code, s.payment_status_code, 
         s.shipment_status_code, s.pickup_delivery_status_code,
         s.completed_at,
         c.full_name, c.whatsapp_number, c.destination_city
      FROM customer_shipments s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.pickup_delivery_status_code IN ('DELIVERED', 'PICKED_UP')
      ORDER BY s.completed_at DESC NULLS LAST
      LIMIT 20
    `);

    shipments = res.rows;
    // We could pass resCompleted.rows to a separate UI block
    const completedShipments = resCompleted.rows;
    shipments = [...shipments, ...completedShipments];
  } catch (err: any) {
    dbError = err.message || "Gagal terkoneksi ke Database.";
  }

  const getStatusBadge = (status: string) => {
     switch(status) {
        case 'NOT_READY': return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold uppercase">Not Ready</span>;
        case 'READY_FOR_PICKUP': return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold uppercase border border-amber-200">Menunggu Ambil</span>;
        case 'OUT_FOR_DELIVERY': return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold uppercase border border-blue-200">Sedang Diantar</span>;
        case 'PICKED_UP': return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold uppercase border border-emerald-200">Berhasil Diambil</span>;
        case 'DELIVERED': return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold uppercase border border-emerald-200">Berhasil Diantar</span>;
        default: return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold uppercase">{status}</span>;
     }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
            <span className="text-blue-600 p-2 bg-blue-50 rounded-2xl">🚚</span> 
            Pickup & Delivery
          </h2>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl text-sm leading-relaxed">
            Pusat penyelesaian *last mile*. Catat serah terima mandiri (*Pickup*) atau pantau pengantaran kurir luar (*Delivery*) ke tangan konsumen. Pastikan lunas sebelum dilepas.
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
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Resi Karung</th>
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Nama Penerima</th>
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Kota</th>
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Kasir</th>
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Status Serah Terima</th>
                  <th className="p-5 font-bold text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 font-medium text-sm">
                      <div className="text-4xl mb-2">📦</div>
                      Tidak ada paket yang menunggu Pickup/Delivery saat ini.
                    </td>
                  </tr>
                ) : (
                  shipments.map((shp) => (
                    <tr key={shp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-5">
                         <div className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block text-sm border border-blue-100">
                           {shp.shipment_code}
                         </div>
                      </td>
                      <td className="p-5">
                        <div className="font-bold text-slate-800 text-sm">{shp.full_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{shp.whatsapp_number}</div>
                      </td>
                      <td className="p-5">
                        <span className="font-bold text-slate-700 uppercase tracking-widest text-xs px-2 py-0.5 rounded border border-slate-200 bg-white">
                           {shp.destination_city}
                        </span>
                      </td>
                      <td className="p-5">
                        {shp.payment_status_code === 'PAID' ? 
                           <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">LUNAS</span>
                         : <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">{shp.payment_status_code}</span>
                        }
                      </td>
                      <td className="p-5">
                         {getStatusBadge(shp.pickup_delivery_status_code)}
                      </td>
                      <td className="p-5">
                         <Link 
                            href={`/delivery/${shp.id}`}
                            className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-all"
                         >
                            KELOLA
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
