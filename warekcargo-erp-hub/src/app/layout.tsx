import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WarekCargo ERP',
  description: 'Sistem Logistik dan Konsolidasi Kargo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col md:flex-row pb-20 md:pb-0 font-sans selection:bg-blue-200`}>
        
        {/* SIDEBAR NAVIGATION (KHUSUS DESKTOP & TABLET) */}
        <aside className="hidden md:flex flex-col w-72 bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen p-6 flex-shrink-0 shadow-2xl">
          <div className="text-3xl font-black mb-10 pb-6 border-b border-white/10 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">WarekCargo.</span>
          </div>
          <nav className="flex flex-col gap-3">
            <Link href="/" className="px-5 py-4 rounded-xl hover:bg-white/10 transition-all font-semibold text-slate-300 hover:text-white flex items-center gap-3">
              🏠 Dashboard Induk
            </Link>
            <Link href="/intake" className="px-5 py-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition-all shadow-sm font-semibold flex items-center gap-3">
              ➕ Terima Paket Hub
            </Link>
            <Link href="/packages" className="px-5 py-4 rounded-xl hover:bg-white/10 transition-all font-semibold text-slate-300 hover:text-white flex items-center gap-3">
              📦 Daftar Paket
            </Link>
            <Link href="/batches" className="px-5 py-4 rounded-xl hover:bg-white/10 transition-all font-semibold text-slate-300 hover:text-white flex items-center gap-3">
              🚢 Jadwal Kapal
            </Link>
          </nav>
          
          <div className="mt-auto pt-6 text-sm text-slate-500 font-medium border-t border-white/10">
            WarekCargo ERP v1.0
          </div>
        </aside>

        {/* CONTAINER KONTEN UTAMA */}
        <main className="flex-1 w-full overflow-y-auto">
          {/* HEADER (KHUSUS MOBILE) */}
          <header className="md:hidden bg-slate-900 text-white p-5 sticky top-0 z-10 shadow-lg flex justify-between items-center bg-opacity-95 backdrop-blur-md">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">WarekCargo Hub</h1>
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">W</div>
          </header>
          
          <div className="relative w-full min-h-full p-4 md:p-10 max-w-7xl mx-auto overflow-hidden">
            {/* Dekorasi Glow Asimetris agar premium */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 pointer-events-none z-0 hidden md:block"></div>
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </main>

        {/* BOTTOM NAVIGATION (KHUSUS MOBILE) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 flex justify-around p-2 md:p-3 z-50 text-[10px] md:text-xs font-bold text-slate-400 shadow-[0_-8px_20px_-1px_rgba(0,0,0,0.05)] pb-safe-area">
          <Link href="/" className="flex flex-col items-center gap-1.5 p-2 focus:text-blue-600 hover:text-slate-800 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span>Home</span>
          </Link>
          <Link href="/intake" className="flex flex-col items-center gap-1.5 p-2 text-blue-600 transition-colors transform scale-110 -translate-y-2 relative">
             <div className="absolute inset-0 bg-blue-100 rounded-full opacity-50 filter blur-md"></div>
             <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg relative z-10">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
             </div>
          </Link>
          <Link href="/packages" className="flex flex-col items-center gap-1.5 p-2 focus:text-blue-600 hover:text-slate-800 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span>Paket</span>
          </Link>
          <Link href="/batches" className="flex flex-col items-center gap-1.5 p-2 focus:text-blue-600 hover:text-slate-800 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span>Jadwal</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}
