import pool from '@/lib/db';
import Link from 'next/link';
import ArrivalForm from '@/components/ArrivalForm';

export const revalidate = 0;

export default async function ArrivalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const batchId = resolvedParams.id;
  
  let batch: any = null;
  let shipments: any[] = [];
  let dbError = null;

  try {
     // Tarik Batch Induk
     const resBatch = await pool.query(`
        SELECT b.*, h.name as origin_hub_name 
        FROM shipping_batches b
        LEFT JOIN hubs h ON b.hub_id = h.id
        WHERE b.id = $1
     `, [batchId]);
     batch = resBatch.rows[0];

     if (batch) {
        // Tarik Muatan Karung
        const resShps = await pool.query(`
           SELECT s.id, s.shipment_code, s.shipment_status_code, c.full_name, c.destination_city
           FROM customer_shipments s
           JOIN customers c ON s.customer_id = c.id
           WHERE s.batch_id = $1
           ORDER BY s.updated_at DESC
        `, [batchId]);
        shipments = resShps.rows;
     }

  } catch (err: any) {
     dbError = err.message || "Gagal terkoneksi ke Database.";
  }

  if (!batch && !dbError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
         <span className="text-6xl mb-4">🚢</span>
         <h2 className="text-2xl font-black text-slate-800">Jadwal Kapal Tidak Ditemukan</h2>
         <Link href="/arrival" className="px-6 py-3 mt-6 bg-slate-900 text-white rounded-xl font-bold">Kembali ke Daftar Kedatangan</Link>
      </div>
    );
  }

  const isArrived = batch?.batch_status_code === 'ARRIVED' || batch?.batch_status_code === 'COMPLETED';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
       <div>
          <Link href="/arrival" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Daftar Kapal
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
            <h2 className="text-3xl md:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
               Bongkar Muat Manifest Kapal
            </h2>
          </div>
          
          <div className="mt-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="text-8xl">⛴️</span>
             </div>
             
             <div className="flex flex-col relative z-10">
               <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Kode Manifest Kapal</span>
               <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block w-fit mt-1 border border-indigo-200">{batch?.batch_code}</span>
             </div>
             <div className="flex flex-col relative z-10">
               <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Armada & Jalur</span>
               <span className="font-bold text-slate-800 text-sm mt-1">{batch?.vessel_name || '(Kapal tidak bernama)'} • Voyage: {batch?.voyage_number || '-'}</span>
             </div>
             <div className="flex flex-col relative z-10">
               <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Rute Integrasi</span>
               <div className="font-bold text-sm bg-slate-100 text-slate-800 px-2 py-0.5 rounded w-fit mt-1 uppercase">
                  {batch?.origin_hub_name} ➔ <span className="text-blue-700">{batch?.destination_city}</span>
               </div>
             </div>
             <div className="flex flex-col relative z-10">
               <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Total Muatan</span>
               <span className="font-black text-lg text-slate-800">{shipments.length} KARUNG</span>
             </div>
          </div>
       </div>

       {dbError && (
         <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold shadow-sm">
            🚨 Koneksi Error: {dbError}
         </div>
       )}

       {!dbError && batch && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-1">
                <ArrivalForm 
                   batchId={batchId} 
                   isArrived={isArrived} 
                   shipmentCount={shipments.length} 
                />
             </div>
             
             <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden flex flex-col max-h-[600px]">
                <h3 className="font-black text-sm tracking-wide text-slate-800 mb-4 pb-3 border-b border-slate-100">DAFTAR KANTONG / KARUNG ({shipments.length})</h3>
                <div className="overflow-y-auto flex-1 pr-2">
                   {shipments.length === 0 ? (
                      <div className="text-center p-10 text-slate-400 font-medium text-sm">Manifest Kapal ini kosong. Harap periksa di modul Keberangkatan.</div>
                   ) : (
                      <ul className="space-y-3">
                         {shipments.map(s => (
                            <li key={s.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group hover:bg-blue-50 transition-colors">
                               <div>
                                  <div className="font-mono font-bold text-slate-800 text-sm">{s.shipment_code}</div>
                                  <div className="text-xs text-slate-500 font-medium mt-0.5">{s.full_name} • <span className="font-bold text-slate-700">{s.destination_city}</span></div>
                               </div>
                               <div className="text-[10px] font-bold tracking-widest bg-white border px-2 py-1 rounded shadow-sm text-slate-600">
                                  {s.shipment_status_code}
                               </div>
                            </li>
                         ))}
                      </ul>
                   )}
                </div>
             </div>
          </div>
       )}
    </div>
  )
}
