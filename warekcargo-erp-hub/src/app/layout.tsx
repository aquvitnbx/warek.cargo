import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './theme.css';
import Link from 'next/link';

const font = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WarekCargo Hub',
  description: 'Sistem Operasional Logistik Internal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${font.className} min-h-screen flex flex-col md:flex-row pb-20 md:pb-0 bg-slate-50 text-slate-800`}>
        
        {/* SIDEBAR NAVIGATION (DESKTOP) */}
        <aside className="hidden md:flex flex-col w-72 bg-blue-900 text-white min-h-screen p-6 shadow-xl flex-shrink-0 relative overflow-hidden z-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-50 pointer-events-none"></div>
          
          <div className="text-3xl font-black mb-10 pb-6 border-b border-blue-800 tracking-tight relative flex items-center gap-2">
            WarekCargo.
          </div>

          <nav className="flex flex-col gap-2 relative z-10">
            <Link href="/" className="px-5 py-4 rounded-xl hover:bg-blue-800 transition-colors text-blue-100 hover:text-white font-semibold flex items-center gap-4">
              <span className="text-xl">📊</span> Dasbor Utana
            </Link>
            <Link href="/intake" className="px-5 py-4 rounded-xl bg-blue-600 border border-blue-500 hover:bg-blue-500 transition-colors shadow-sm font-bold flex items-center gap-4 my-2">
              <span className="text-xl">➕</span> Terima Paket
            </Link>
            <Link href="/packages" className="px-5 py-4 rounded-xl hover:bg-blue-800 transition-colors text-blue-100 hover:text-white font-semibold flex items-center gap-4">
              <span className="text-xl">📋</span> Data Manifest
            </Link>
            <Link href="/batches" className="px-5 py-4 rounded-xl hover:bg-blue-800 transition-colors text-blue-100 hover:text-white font-semibold flex items-center gap-4">
              <span className="text-xl">🚢</span> Jadwal Kapal
            </Link>
            <Link href="/customers" className="px-5 py-4 rounded-xl hover:bg-blue-800 transition-colors text-blue-100 hover:text-white font-semibold flex items-center gap-4">
              <span className="text-xl">👥</span> Pelanggan
            </Link>
            <Link href="/consolidation" className="px-5 py-4 rounded-xl hover:bg-blue-800 transition-colors border border-blue-800 border-dashed text-blue-100 hover:text-white font-semibold flex items-center gap-4">
              <span className="text-xl">📦</span> Konsolidasi
            </Link>
            <Link href="/repacking" className="px-5 py-4 rounded-xl hover:bg-blue-800 transition-colors border border-emerald-800 border-dashed text-emerald-100 hover:text-white font-semibold flex items-center gap-4">
              <span className="text-xl">⚖️</span> Timbang Repack
            </Link>
            <Link href="/finance" className="px-5 py-4 rounded-xl hover:bg-blue-800 transition-colors text-blue-100 hover:text-white font-semibold flex items-center gap-4">
              <span className="text-xl">💳</span> Kasir & Tagihan
            </Link>
          </nav>
        </aside>

        {/* CONTAINER KONTEN UTAMA */}
        <main className="flex-1 w-full overflow-y-auto">
          {/* HEADER (MOBILE) */}
          <header className="md:hidden bg-blue-900 text-white p-5 sticky top-0 z-30 flex justify-between items-center shadow-md">
            <h1 className="text-xl font-bold tracking-tight">WarekCargo Hub</h1>
            <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-bold">W</div>
          </header>
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* BOTTOM NAVIGATION (MOBILE) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50 text-[10px] font-bold text-slate-500 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] pb-safe-area">
          <Link href="/" className="flex flex-col items-center p-2 pt-3 hover:text-blue-600 transition-colors w-16">
            <span className="text-2xl mb-1">📊</span> Home
          </Link>
          <Link href="/intake" className="flex flex-col items-center p-2 relative -top-5">
             <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-slate-50 outline-none">
               <span className="text-2xl">➕</span>
             </div>
          </Link>
          <Link href="/packages" className="flex flex-col items-center p-2 pt-3 hover:text-blue-600 transition-colors w-12">
            <span className="text-2xl mb-1">📋</span> Data
          </Link>
          <Link href="/batches" className="flex flex-col items-center p-2 pt-3 hover:text-blue-600 transition-colors w-12">
            <span className="text-2xl mb-1">🚢</span> Kapal
          </Link>
          <Link href="/customers" className="flex flex-col items-center p-2 pt-3 hover:text-blue-600 transition-colors w-12 text-center text-[9px]">
            <span className="text-2xl mb-1">👥</span> Cli
          </Link>
          <Link href="/consolidation" className="flex flex-col items-center p-2 pt-3 hover:text-blue-600 transition-colors w-12 text-center text-[9px]">
            <span className="text-2xl mb-1">📦</span> Pack
          </Link>
          <Link href="/repacking" className="flex flex-col items-center p-2 pt-3 hover:text-emerald-600 transition-colors w-12 text-center text-[9px]">
            <span className="text-2xl mb-1">⚖️</span> Scale
          </Link>
          <Link href="/finance" className="flex flex-col items-center p-2 pt-3 hover:text-amber-600 transition-colors w-12 text-center text-[9px]">
            <span className="text-2xl mb-1">💳</span> Pay
          </Link>
        </nav>
      </body>
    </html>
  );
}
