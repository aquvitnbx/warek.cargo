import pool from '@/lib/db';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import IntakeCorrectionForm from '@/components/IntakeCorrectionForm';

export const revalidate = 0;

export default async function PackageEditPage({ params }: { params: Promise<{ tracking_number: string }> }) {
  const resolvedParams = await params;
  const { tracking_number } = resolvedParams;

  let pkg = null;
  let isBound = false;
  let customers = [];

  try {
    const res = await pool.query(`
      SELECT p.*, h.code as hub_code, c.full_name as customer_name
      FROM inbound_packages p
      LEFT JOIN hubs h ON p.hub_id = h.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.tracking_number = $1
    `, [tracking_number]);

    if (res.rows.length === 0) {
      return notFound();
    }
    pkg = res.rows[0];

    const relRes = await pool.query(`SELECT COUNT(*) as cnt FROM shipment_packages WHERE inbound_package_id = $1`, [pkg.id]);
    isBound = parseInt(relRes.rows[0].cnt) > 0;

    const custRes = await pool.query(`SELECT id, full_name, customer_code FROM customers WHERE is_active = true ORDER BY full_name`);
    customers = custRes.rows;
  } catch (err: any) {
    console.error(err);
    throw new Error('Gagal memuat data detail resi manifes.');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4 animate-in fade-in pb-12">
      <div className="flex items-center gap-3 mb-1 border-b border-slate-200 pb-5">
         <Link href="/packages" className="text-slate-400 hover:text-blue-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
         </Link>
         <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
               <span className="text-3xl">✏️</span> Koreksi Data Manifest
            </h1>
            <p className="text-slate-500 text-sm font-bold tracking-widest mt-1 ml-10">RESI: <span className="text-blue-600 font-mono">{tracking_number}</span></p>
         </div>
      </div>

      <IntakeCorrectionForm packageData={pkg} isBound={isBound} customers={customers} returnUrl="/packages" />
      
    </div>
  );
}
