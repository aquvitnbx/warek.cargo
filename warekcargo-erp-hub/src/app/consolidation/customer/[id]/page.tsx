import pool from '@/lib/db';
import Link from 'next/link';
import ConsolidationForm from '@/components/ConsolidationForm';

export const revalidate = 0;

export default async function CustomerConsolidationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const customerId = resolvedParams.id;
  
  let customer: any = null;
  let packages: any[] = [];
  let serviceTypes: any[] = [];
  let dbError = null;

  try {
     // Fetch Customer
     const resCust = await pool.query(`SELECT * FROM customers WHERE id = $1`, [customerId]);
     customer = resCust.rows[0];

     if (customer) {
       // Fetch Pending Packages for this customer
       const queryPkg = `
          SELECT p.id, p.tracking_number, p.received_at, p.item_description, p.quantity, h.code as hub_code
          FROM inbound_packages p
          LEFT JOIN hubs h ON p.hub_id = h.id
          LEFT JOIN shipment_packages sp ON p.id = sp.inbound_package_id
          WHERE p.customer_id = $1 
            AND sp.shipment_id IS NULL
            AND p.package_status_code IN ('RECEIVED_AT_HUB', 'REPACKING')
          ORDER BY p.received_at ASC
       `;
       const resPkg = await pool.query(queryPkg, [customerId]);
       packages = resPkg.rows;

       // Fetch Service Types for dropdown
       const resSvc = await pool.query(`SELECT code, name FROM ref_service_types WHERE is_active = true ORDER BY sort_order`);
       serviceTypes = resSvc.rows;
     }
  } catch (err: any) {
     dbError = err.message || "Gagal terkoneksi ke Database.";
  }

  if (!customer && !dbError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
         <span className="text-6xl mb-4">👻</span>
         <h2 className="text-2xl font-black text-slate-800">Customer Tidak Valid</h2>
         <Link href="/consolidation" className="px-6 py-3 mt-6 bg-slate-900 text-white rounded-xl font-bold">Kembali ke Antrean</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
       <div>
          <Link href="/consolidation" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Antrean
          </Link>
          <h2 className="text-3xl md:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
             Pengepakan Karung
          </h2>
          <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Pemilik Paket</span>
               <span className="font-black text-lg text-slate-800">{customer?.full_name}</span>
             </div>
             <div className="flex flex-col md:text-right mt-2 md:mt-0">
               <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Destinasi</span>
               <span className="font-bold text-slate-700">{customer?.destination_city}</span>
             </div>
          </div>
       </div>

       {dbError && (
         <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold shadow-sm">
            🚨 Koneksi Error: {dbError}
         </div>
       )}

       {!dbError && packages.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
             <span className="text-4xl">🧹</span>
             <h3 className="mt-4 font-bold text-slate-600">Pelanggan ini sudah bersih!</h3>
             <p className="text-sm text-slate-500 mt-1">Tidak ada rsi nganggur yang memerlukan jahit karung.</p>
          </div>
       ) : (
          <ConsolidationForm 
             customerId={customerId} 
             packages={packages} 
             serviceTypes={serviceTypes} 
          />
       )}
    </div>
  )
}
