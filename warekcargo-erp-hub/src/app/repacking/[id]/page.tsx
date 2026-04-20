import pool from '@/lib/db';
import Link from 'next/link';
import RepackingForm from '@/components/RepackingForm';

export const revalidate = 0;

export default async function RepackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const shipmentId = resolvedParams.id;
  
  let shipment: any = null;
  let packages: any[] = [];
  let dbError = null;

  try {
     // Fetch Shipment & Customer details
     const resShp = await pool.query(`
        SELECT 
           s.*, 
           c.full_name, c.customer_code, c.whatsapp_number, c.destination_city 
        FROM customer_shipments s
        JOIN customers c ON s.customer_id = c.id
        WHERE s.id = $1
     `, [shipmentId]);
     shipment = resShp.rows[0];

     if (shipment) {
       // Fetch Packages bounded to this shipment
       const queryPkg = `
          SELECT p.id, p.tracking_number, p.received_at, p.item_description, p.quantity, h.code as hub_code
          FROM inbound_packages p
          JOIN shipment_packages sp ON p.id = sp.inbound_package_id
          LEFT JOIN hubs h ON p.hub_id = h.id
          WHERE sp.shipment_id = $1
          ORDER BY p.received_at ASC
       `;
       const resPkg = await pool.query(queryPkg, [shipmentId]);
       packages = resPkg.rows;
     }
  } catch (err: any) {
     dbError = err.message || "Gagal terkoneksi ke Database.";
  }

  if (!shipment && !dbError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
         <span className="text-6xl mb-4">👻</span>
         <h2 className="text-2xl font-black text-slate-800">Shipment Tidak Valid</h2>
         <Link href="/repacking" className="px-6 py-3 mt-6 bg-slate-900 text-white rounded-xl font-bold">Kembali ke Gudang Repack</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
       <div>
          <Link href="/repacking" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Antrean
          </Link>
          <h2 className="text-3xl md:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
             Finalisasi & Timbang Karung
          </h2>
          <div className="mt-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="flex flex-col">
               <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Kode Shipment</span>
               <span className="font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block w-fit mt-1">{shipment?.shipment_code}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Pemilik</span>
               <span className="font-bold text-slate-800 text-sm mt-1">{shipment?.full_name}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Status Saat Ini</span>
               <span className="font-bold text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded w-fit mt-1">{shipment?.shipment_status_code}</span>
             </div>
             <div className="flex flex-col md:text-right">
               <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Total Paket</span>
               <span className="font-black text-slate-700 text-lg">{packages.length} <span className="text-xs">pcs</span></span>
             </div>
          </div>
       </div>

       {dbError && (
         <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold shadow-sm">
            🚨 Koneksi Error: {dbError}
         </div>
       )}

       {!dbError && (
          <RepackingForm 
             shipmentId={shipmentId}
             shipment={shipment}
             packages={packages} 
          />
       )}
    </div>
  )
}
