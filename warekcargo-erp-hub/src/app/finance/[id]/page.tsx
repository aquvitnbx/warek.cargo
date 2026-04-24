import pool from '@/lib/db';
import Link from 'next/link';
import CashierForm from '@/components/CashierForm';

type PricingRate = {
  id: string;
  origin_hub_id: string;
  destination_city: string;
  service_type_code: string;
  price_per_kg: number;
  price_per_m3: number;
  min_weight_kg: number;
  min_volume_m3: number;
};

type ShipmentFinanceDetail = {
  id: string;
  shipment_code: string;
  payment_status_code: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUND_PENDING' | 'VOIDED' | 'CANCELLED';
  total_weight_kg: number | null;
  total_volume_m3: number | null;
  full_name: string;
  whatsapp_number: string | null;
  destination_city: string;
  final_charge_amount: number | null;
  origin_hub_id: string | null;
  service_type_code: string;
  pricing_rate?: PricingRate;
};

type ShipmentPaymentHistory = {
  id: string;
  shipment_id: string;
  payment_method_code: string;
  amount: number;
  payment_reference: string | null;
  paid_to: string | null;
  notes: string | null;
  paid_at: string | Date;
  method_name: string;
};

type PaymentMethodOption = {
  code: string;
  name: string;
};

export const revalidate = 0;

export default async function FinanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const shipmentId = resolvedParams.id;

  let shipment: ShipmentFinanceDetail | null = null;
  let payments: ShipmentPaymentHistory[] = [];
  let paymentMethods: PaymentMethodOption[] = [];
  let dbError: string | null = null;

  try {
    const resShp = await pool.query(`
      SELECT 
        s.*, 
        c.full_name, c.whatsapp_number, c.destination_city,
        b.hub_id as origin_hub_id 
      FROM customer_shipments s
      JOIN customers c ON s.customer_id = c.id
      LEFT JOIN shipping_batches b ON s.batch_id = b.id
      WHERE s.id = $1
    `, [shipmentId]);
    shipment = resShp.rows[0] ?? null;

    if (shipment) {
      const queryPay = `
        SELECT p.*, m.name as method_name
        FROM shipment_payments p
        JOIN ref_payment_methods m ON p.payment_method_code = m.code
        WHERE p.shipment_id = $1
        ORDER BY p.paid_at ASC
      `;
      const resPay = await pool.query(queryPay, [shipmentId]);
      payments = resPay.rows;

      const resMeth = await pool.query(`SELECT code, name FROM ref_payment_methods WHERE is_active = true`);
      paymentMethods = resMeth.rows;

      if (!shipment.final_charge_amount && shipment.origin_hub_id) {
        const resRate = await pool.query(`
          SELECT * FROM master_pricing_rates 
          WHERE origin_hub_id = $1 
            AND destination_city = $2 
            AND service_type_code = $3 
            AND is_active = true
          LIMIT 1
        `, [shipment.origin_hub_id, shipment.destination_city, shipment.service_type_code]);

        if (resRate.rows.length > 0) {
          shipment.pricing_rate = resRate.rows[0];
        }
      }
    }
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : 'Gagal terkoneksi ke Database.';
  }

  if (!shipment && !dbError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <h2 className="text-2xl font-black text-slate-800">Tagihan Tidak Valid</h2>
        <Link href="/finance" className="px-6 py-3 mt-4 bg-slate-900 text-white rounded-xl font-bold">Kembali ke Kasir</Link>
      </div>
    );
  }

  const statusBadgeClass = shipment
    ? shipment.payment_status_code === 'PAID'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : shipment.payment_status_code === 'PARTIAL'
        ? 'bg-blue-100 text-blue-800 border-blue-200'
        : shipment.payment_status_code === 'REFUND_PENDING'
          ? 'bg-rose-100 text-rose-800 border-rose-200'
          : ['VOIDED', 'CANCELLED'].includes(shipment.payment_status_code)
            ? 'bg-slate-200 text-slate-700 border-slate-300'
            : 'bg-amber-100 text-amber-800 border-amber-200'
    : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <Link href="/finance" className="text-blue-500 hover:text-blue-700 font-bold text-sm tracking-wide mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Antrean Kasir
        </Link>
        <h2 className="text-3xl md:text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3">
          🧾 Tagihan & Kasir Karung
        </h2>
        <div className="mt-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 relative overflow-hidden">
          {shipment?.payment_status_code === 'PAID' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <span className="text-9xl font-black rotate-[-15deg] uppercase">LUNAS</span>
            </div>
          )}

          <div className="flex flex-col relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Kode Shipment</span>
            <span className="font-mono font-black text-slate-700 mt-1">{shipment?.shipment_code}</span>
          </div>
          <div className="flex flex-col relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Dimensi Terukur</span>
            <span className="font-bold text-slate-800 text-sm mt-1">{shipment?.total_weight_kg || 0} kg <span className="text-slate-400 mx-1">|</span> {shipment?.total_volume_m3 || 0} m³</span>
          </div>
          <div className="flex flex-col relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Pemilik / Pembayar</span>
            <span className="font-bold text-sm text-slate-800 mt-1">{shipment?.full_name}</span>
          </div>
          <div className="flex flex-col md:text-right relative z-10">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Status Pembayaran</span>
            <span className={`font-bold text-xs px-2 py-0.5 rounded w-fit md:ml-auto mt-1 uppercase tracking-widest border ${statusBadgeClass}`}>
              {shipment?.payment_status_code}
            </span>
          </div>
        </div>
      </div>

      {dbError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold shadow-sm">
          🚨 Koneksi Error: {dbError}
        </div>
      )}

      {!dbError && shipment && (
        <CashierForm
          shipment={shipment}
          payments={payments}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
}
