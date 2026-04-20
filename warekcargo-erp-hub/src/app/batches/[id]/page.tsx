import pool from '@/lib/db';
import Link from 'next/link';
import BatchAssignmentForm from '@/components/BatchAssignmentForm';

export const revalidate = 0;

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const batchId = resolvedParams.id;
  
  let batch: any = null;
  let assignedShipments: any[] = [];
  let candidateShipments: any[] = [];
  let dbError = null;

  try {
     // Fetch Batch
     const resBatch = await pool.query(`
        SELECT 
           b.*, 
           h.name as hub_name, 
           h.code as hub_code,
           po.name as origin_port_name
        FROM shipping_batches b
        LEFT JOIN hubs h ON b.hub_id = h.id
        LEFT JOIN ref_ports po ON b.origin_port_code = po.code
        WHERE b.id = $1
     `, [batchId]);
     batch = resBatch.rows[0];

     if (batch) {
       // Fetch Assigned Shipments
       const resAssigned = await pool.query(`
          SELECT s.*, c.full_name, c.customer_code 
          FROM customer_shipments s
          JOIN customers c ON s.customer_id = c.id
          WHERE s.batch_id = $1
          ORDER BY s.updated_at DESC
       `, [batchId]);
       assignedShipments = resAssigned.rows;

       // Fetch Candidate Shipments (Ready to fly/sail)
       const resCandidates = await pool.query(`
          SELECT s.*, c.full_name, c.customer_code 
          FROM customer_shipments s
          JOIN customers c ON s.customer_id = c.id
          WHERE s.batch_id IS NULL 
            AND s.shipment_status_code = 'READY_FOR_DISPATCH'
          ORDER BY s.updated_at ASC
       `);
       candidateShipments = resCandidates.rows;
     }
  } catch (err: any) {
     dbError = err.message || "Gagal terkoneksi ke Database.";
  }

  if (!batch && !dbError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
         <span className="text-6xl mb-4">👻</span>
         <h2 className="text-2xl font-black text-slate-800">Batch Tidak Valid</h2>
         <Link href="/batches" className="px-6 py-3 mt-6 bg-slate-900 text-white rounded-xl font-bold">Kembali ke Daftar Kapal</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
       <div>
          <Link href="/batches" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Manifest Kapal
          </Link>
          <h2 className="text-3xl md:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
             🚢 {batch?.vessel_name || 'TBA'} {batch?.voyage_number ? `(${batch?.voyage_number})` : ''}
          </h2>
          <div className="mt-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6">
             <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Kode Keberangkatan</span>
               <span className="font-mono font-black text-slate-700 mt-1">{batch?.batch_code}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Rute</span>
               <span className="font-bold text-slate-800 text-sm mt-1">{batch?.origin_port_name || batch?.hub_code} ➔ {batch?.destination_city}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Jadwal ETD</span>
               <span className="font-bold text-sm text-slate-800 mt-1">{new Date(batch?.etd_at).toLocaleDateString('id-ID')}</span>
             </div>
             <div className="flex flex-col md:text-right">
               <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Status</span>
               <span className="font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded w-fit md:ml-auto mt-1">{batch?.batch_status_code}</span>
             </div>
          </div>
       </div>

       {dbError && (
         <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold shadow-sm">
            🚨 Koneksi Error: {dbError}
         </div>
       )}

       {!dbError && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
             
             {/* KIRI: Kandidat Form Assign */}
             <div className="w-full lg:w-1/2">
                <BatchAssignmentForm 
                   batchId={batchId} 
                   candidates={candidateShipments} 
                />
             </div>

             {/* KANAN: Assigned Manifest list */}
             <div className="w-full lg:w-1/2 flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-white">
                   <h3 className="font-black text-slate-800 text-sm tracking-wide flex items-center gap-2">
                       ✅ KARUNG TERDAFTAR (MANIFEST)
                   </h3>
                </div>
                <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                   {assignedShipments.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center opacity-50">
                          <span className="text-4xl grayscale mb-2">⚓</span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Belum ada muatan</span>
                      </div>
                   ) : (
                      assignedShipments.map(shp => (
                         <div key={shp.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-sm hover:border-blue-300 transition-colors">
                            <div className="pt-1"><span className="text-xl">📦</span></div>
                            <div className="flex flex-col flex-1">
                               <div className="flex justify-between items-start">
                                  <span className="font-black text-slate-800 text-sm">{shp.full_name}</span>
                                  <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{shp.shipment_code}</span>
                               </div>
                               <div className="flex gap-4 mt-2">
                                  <div className="flex flex-col">
                                     <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Berat</span>
                                     <span className="text-xs font-bold text-slate-700">{shp.total_weight_kg} kg</span>
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Volume (Dim)</span>
                                     <span className="text-xs font-bold text-slate-700">{shp.total_volume_m3} m³</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>
             
          </div>
       )}
    </div>
  )
}
