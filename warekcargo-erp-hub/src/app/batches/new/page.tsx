import pool from '@/lib/db';
import Link from 'next/link';
import NewBatchForm from '@/components/NewBatchForm';

export const revalidate = 0;

export default async function NewBatchPage() {
  let hubs = [];
  let serviceTypes = [];
  let transportModes = [];
  let ports = [];
  let dbError = null;

  try {
     const resHub = await pool.query(`SELECT id, name, code FROM hubs WHERE is_active = true`);
     hubs = resHub.rows;

     const resSvc = await pool.query(`SELECT code, name FROM ref_service_types WHERE is_active = true ORDER BY sort_order`);
     serviceTypes = resSvc.rows;

     const resTr = await pool.query(`SELECT code, name FROM ref_transport_modes WHERE is_active = true ORDER BY sort_order`);
     transportModes = resTr.rows;

     const resPorts = await pool.query(`SELECT code, name, city FROM ref_ports WHERE is_active = true ORDER BY name`);
     ports = resPorts.rows;
  } catch (err: any) {
     dbError = err.message;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
       <div>
          <Link href="/batches" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </Link>
          <h2 className="text-3xl md:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
             🚢 Buka Rencana Kapal
          </h2>
       </div>

       {dbError && (
         <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold shadow-sm">
            🚨 Koneksi Error: {dbError}
         </div>
       )}

       {!dbError && (
          <NewBatchForm 
             hubs={hubs}
             serviceTypes={serviceTypes}
             transportModes={transportModes}
             ports={ports}
          />
       )}
    </div>
  )
}
