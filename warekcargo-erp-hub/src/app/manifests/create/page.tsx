import pool from '@/lib/db';
import Link from 'next/link';
import ManifestCreateForm from '@/components/manifests/ManifestCreateForm';

export const revalidate = 0;

export default async function CreateBatchPage() {
  let hubs = [];
  try {
     const resHubs = await pool.query(`SELECT id, code, name FROM hubs WHERE is_active = true ORDER BY name`);
     hubs = resHubs.rows;
  } catch (err) {
     console.error('Failed to load hubs:', err);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4 animate-in fade-in pb-12">
      <div className="flex items-center gap-3 mb-1 border-b border-slate-200 pb-5">
         <Link href="/manifests" className="text-slate-400 hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
         </Link>
         <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
               ➕ Pendaftaran Jadwal Armada
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1 ml-1">Buat gerbang konsolidasi bagi karung-karung agar bisa dimanifest-kan.</p>
         </div>
      </div>

      <ManifestCreateForm hubs={hubs} />
    </div>
  );
}
