import pool from '@/lib/db';
import Link from 'next/link';

type FinanceShipmentRow = {
  id: string;
  shipment_code: string;
  payment_status_code: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUND_PENDING' | 'VOIDED' | 'CANCELLED';
  final_charge_amount: number | null;
  amount_paid: number | null;
  total_weight_kg: number | null;
  total_volume_m3: number | null;
  full_name: string;
  whatsapp_number: string | null;
};

export const revalidate = 0;

export default async function FinanceDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || 'active';

  let allShipments: FinanceShipmentRow[] = [];
  let activeShipments: FinanceShipmentRow[] = [];
  let refundShipments: FinanceShipmentRow[] = [];
  let dbError: string | null = null;

  try {
    const query = `
      SELECT 
         s.id,
         s.shipment_code,
         s.payment_status_code,
         s.final_charge_amount,
         s.amount_paid,
         s.total_weight_kg,
         s.total_volume_m3,
         c.full_name,
         c.whatsapp_number
      FROM customer_shipments s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.total_weight_kg IS NOT NULL 
        AND s.total_weight_kg > 0
      ORDER BY 
         CASE s.payment_status_code 
            WHEN 'REFUND_PENDING' THEN 1
            WHEN 'PENDING' THEN 2
            WHEN 'PARTIAL' THEN 3
            WHEN 'PAID' THEN 4
            WHEN 'VOIDED' THEN 5
            WHEN 'CANCELLED' THEN 6
            ELSE 7
         END,
         s.updated_at DESC
    `;
    const res = await pool.query(query);
    allShipments = res.rows;

    if (currentTab === 'active') {
      refundShipments = allShipments.filter((shipment) => shipment.payment_status_code === 'REFUND_PENDING');
      activeShipments = allShipments.filter((shipment) => !['REFUND_PENDING', 'PAID', 'VOIDED', 'CANCELLED'].includes(shipment.payment_status_code));
    } else if (currentTab === 'finished') {
      activeShipments = allShipments.filter((shipment) => shipment.payment_status_code === 'PAID');
    } else if (currentTab === 'voided') {
      activeShipments = allShipments.filter((shipment) => ['VOIDED', 'CANCELLED'].includes(shipment.payment_status_code));
    }
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : 'Gagal terkoneksi ke Database.';
  }

  const formatIdr = (num: number) => {
    if (!num) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const outstandingCount = activeShipments.filter((shipment) => shipment.payment_status_code !== 'PAID').length;
  const recordedCash = allShipments
    .filter((shipment) => !['VOIDED', 'CANCELLED'].includes(shipment.payment_status_code))
    .reduce((acc, curr) => acc + Number(curr.amount_paid || 0), 0);

  const getStatusColor = (status: FinanceShipmentRow['payment_status_code']) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REFUND_PENDING':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'VOIDED':
      case 'CANCELLED':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
            💳 Kasir & Tagihan
          </h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">Tetapkan perhitungan biaya akhir dan catat penerimaan uang atas karung pengiriman.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 gap-6">
        <Link
          href="/finance?tab=active"
          className={`pb-3 font-bold text-sm tracking-wide ${currentTab === 'active' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Sedang Berjalan (Tunggakan)
        </Link>
        <Link
          href="/finance?tab=finished"
          className={`pb-3 font-bold text-sm tracking-wide ${currentTab === 'finished' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          ✔ Riwayat Lunas
        </Link>
        <Link
          href="/finance?tab=voided"
          className={`pb-3 font-bold text-sm tracking-wide ${currentTab === 'voided' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          ❌ Void & Batal
        </Link>
      </div>

      {dbError && (
        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl text-red-700 shadow-sm text-sm font-bold">
          Data gagal diambil: {dbError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20">
          <h4 className="text-blue-200 font-bold text-xs uppercase tracking-widest mb-1">Piutang Menggantung</h4>
          <div className="text-3xl font-black">{outstandingCount}</div>
          <div className="text-xs text-blue-300 mt-2">Karung Menunggu Lunas</div>
        </div>
        <div className="bg-emerald-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
          <h4 className="text-emerald-100 font-bold text-xs uppercase tracking-widest mb-1">Uang Masuk Tercatat</h4>
          <div className="text-2xl font-black mt-1">{formatIdr(recordedCash)}</div>
        </div>
        {refundShipments.length > 0 && (
          <div className="bg-rose-500 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/20 ring-4 ring-rose-500/30 animate-pulse">
            <h4 className="text-rose-200 font-bold text-xs uppercase tracking-widest mb-1">Butuh Resolusi Manual</h4>
            <div className="text-2xl font-black mt-1">{refundShipments.length} Karung</div>
            <div className="text-xs text-rose-200 mt-2 font-medium">Refund / kelebihan bayar / pembatalan</div>
          </div>
        )}
      </div>

      {refundShipments.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="bg-rose-100/50 p-4 border-b border-rose-200 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-bold text-rose-800">Antrean Resolusi Finansial (Refund / Void)</h3>
              <p className="text-xs text-rose-600">Karung di bawah ini telah dibatalkan secara logistik, namun terdapat uang masuk yang wajib diselesaikan manual.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-rose-50 text-rose-700 font-black uppercase text-[10px] tracking-widest border-b border-rose-200">
                <tr>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Kode Karung</th>
                  <th className="p-4">Tagihan Final</th>
                  <th className="p-4 text-rose-600">Uang Disetor</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 bg-white">
                {refundShipments.map((shipment) => {
                  const bill = shipment.final_charge_amount ? Number(shipment.final_charge_amount) : 0;
                  const paid = Number(shipment.amount_paid || 0);

                  return (
                    <tr key={shipment.id} className="hover:bg-rose-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{shipment.full_name}</div>
                        <div className="font-mono text-xs text-slate-400">{shipment.whatsapp_number || '-'}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{shipment.shipment_code}</span>
                      </td>
                      <td className="p-4 font-black text-slate-700">{formatIdr(bill)}</td>
                      <td className="p-4 font-black text-rose-600 text-lg">{formatIdr(paid)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 border text-[10px] font-bold tracking-widest uppercase rounded ${getStatusColor(shipment.payment_status_code)}`}>
                          {shipment.payment_status_code}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/finance/${shipment.id}`} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                          Selesaikan Uang Masuk
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-700">
            {currentTab === 'finished' ? 'Riwayat Tagihan Selesai (Lunas)' : currentTab === 'voided' ? 'Riwayat Tagihan Dibatalkan (Void/Batal)' : 'Antrean Penagihan Aktif'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Kode Karung</th>
                <th className="p-4">Dimensi Fisik</th>
                <th className="p-4">Tagihan Final</th>
                <th className="p-4">Terbayar</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeShipments.map((shipment) => {
                const bill = shipment.final_charge_amount ? Number(shipment.final_charge_amount) : 0;
                const paid = Number(shipment.amount_paid || 0);

                return (
                  <tr key={shipment.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{shipment.full_name}</div>
                      <div className="font-mono text-xs text-slate-400">{shipment.whatsapp_number || '-'}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{shipment.shipment_code}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium text-xs">
                      {shipment.total_weight_kg} kg <br /> {shipment.total_volume_m3} m³
                    </td>
                    <td className="p-4 font-black text-slate-700">
                      {bill > 0 ? formatIdr(bill) : <span className="text-slate-400 italic font-medium">Belum Ditetapkan</span>}
                    </td>
                    <td className="p-4 font-bold text-blue-600">{paid > 0 ? formatIdr(paid) : '-'}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 border text-[10px] font-bold tracking-widest uppercase rounded ${getStatusColor(shipment.payment_status_code)}`}>
                        {shipment.payment_status_code}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/finance/${shipment.id}`} className="px-4 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors">
                        Buka Kasir
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {activeShipments.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500 font-medium">
                    {currentTab === 'finished'
                      ? 'Belum ada riwayat tagihan lunas.'
                      : currentTab === 'voided'
                        ? 'Belum ada riwayat tagihan void/batal.'
                        : 'Tidak ada antrean tagihan yang menggantung.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
