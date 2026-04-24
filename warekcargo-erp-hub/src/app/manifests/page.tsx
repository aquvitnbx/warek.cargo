import pool from '@/lib/db';
import Link from 'next/link';

export const revalidate = 0;

export default async function ManifestsList({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const resolvedParams = await searchParams;
  const isFinishedTab = resolvedParams.tab === 'finished';

  let batches = [];
  let hubs = [];
  let errorMsg = null;

  try {
     const resBatches = await pool.query(`
        SELECT b.*, h.code as hub_code, 
        (SELECT COUNT(*) FROM customer_shipments cs WHERE cs.batch_id = b.id) as karung_count
        FROM shipping_batches b
        LEFT JOIN hubs h ON b.hub_id = h.id
        ORDER BY CASE b.batch_status_code 
          WHEN 'OPEN' THEN 1 
          WHEN 'CLOSED' THEN 2 
          WHEN 'DEPARTED' THEN 3 
          ELSE 4 END ASC, b.etd_at ASC
     `);
     batches = resBatches.rows;

     const resHubs = await pool.query(`SELECT id, code, name FROM hubs WHERE is_active = true`);
     hubs = resHubs.rows;
  } catch (err: any) {
     errorMsg = err.message;
  }

  return (
    <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 overflow-x-hidden">
       {/* HEADER */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <span className="text-4xl text-blue-600">🚢</span> Jadwal Armada & Manifest
               </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium mt-2">Atur daftar kalender keberangkatan armada & pantau alokasi karung muatan.</p>
          </div>
          <Link href="/manifests/create" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-widest text-sm rounded-xl shadow-sm transition-colors whitespace-nowrap">
             + BUAT JADWAL BARU
          </Link>
       </div>

       {/* TABS FILTER */}
       <div className="flex border-b border-slate-200 gap-6">
          <Link 
            href="/manifests?tab=active" 
            className={`pb-3 font-bold text-sm tracking-wide ${!isFinishedTab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
             Sedang Berjalan
          </Link>
          <Link 
            href="/manifests?tab=finished" 
            className={`pb-3 font-bold text-sm tracking-wide ${isFinishedTab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
             Selesai & Batal
          </Link>
       </div>

       {errorMsg && (
          <div className="p-4 bg-red-50 text-red-600 font-bold text-sm border-l-4 border-red-500">
             Gagal Memuat Database: {errorMsg}
          </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.filter((b: any) => {
             const isFinished = b.batch_status_code === 'ARRIVED' || b.batch_status_code === 'CANCELLED';
             return isFinishedTab ? isFinished : !isFinished;
          }).map((b: any) => {
             const isOpen = b.batch_status_code === 'OPEN';
             const isClosed = b.batch_status_code === 'CLOSED';
             const isDeparted = b.batch_status_code === 'DEPARTED';
             const isCancelled = b.batch_status_code === 'CANCELLED';

             return (
               <div key={b.id} className={`flex flex-col bg-white border ${isOpen ? 'border-blue-300' : isClosed ? 'border-amber-300' : 'border-slate-200'} rounded-2xl shadow-sm overflow-hidden relative transition-all hover:shadow-md group`}>
                  
                  {/* Status Indicator Bar */}
                  <div className={`h-1.5 w-full ${isOpen ? 'bg-blue-500' : isClosed ? 'bg-amber-400' : isDeparted ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>

                  <div className="p-5 flex-1">
                     <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase tracking-widest ${isOpen ? 'bg-blue-100 text-blue-700' : isClosed ? 'bg-amber-100 text-amber-700' : isDeparted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                           {b.batch_status_code}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded tracking-widest">
                           {b.hub_code}
                        </span>
                     </div>
                     <h3 className="text-lg font-black text-slate-800 leading-tight mb-1 truncate">
                        {b.vessel_name}
                     </h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Voyage: {b.voyage_number || 'TBA'}</p>

                     <div className="space-y-2 mb-6 border-l-2 border-slate-100 pl-3">
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-400 font-medium tracking-wide">ETD (Jadwal)</span>
                           <span className="text-slate-800 font-bold">{new Date(b.etd_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-400 font-medium tracking-wide">Modus</span>
                           <span className="text-slate-800 font-bold">{b.transport_mode_code?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                           <span className="text-slate-400 font-medium tracking-wide">Muatan</span>
                           <span className="text-slate-800 font-black">{b.karung_count} <span className="text-slate-400 font-medium">Karung</span></span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                         <span className="text-xs font-mono text-slate-400 font-bold">{b.batch_code}</span>
                     </div>
                     <Link href={`/manifests/${b.id}`} className="px-4 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors">
                        KELOLA
                     </Link>
                  </div>
               </div>
             );
          })}

          {batches.filter((b: any) => {
             const isFinished = b.batch_status_code === 'ARRIVED' || b.batch_status_code === 'CANCELLED';
             return isFinishedTab ? isFinished : !isFinished;
          }).length === 0 && (
             <div className="md:col-span-2 lg:col-span-3 text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
                <span className="text-5xl opacity-50 block mb-4">⚓</span>
                <h3 className="text-lg font-bold text-slate-600 uppercase tracking-widest">
                   {isFinishedTab ? 'Belum Ada Jadwal Selesai' : 'Belum Ada Jadwal Pelayaran Aktif'}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                   {isFinishedTab ? 'Data histori kapal yang tiba atau batal akan muncul di sini.' : 'Buat jadwal armada baru untuk mulai memuat manifest karung Anda.'}
                </p>
             </div>
          )}
       </div>

    </div>
  );
}
