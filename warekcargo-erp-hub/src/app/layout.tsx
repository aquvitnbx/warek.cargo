import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const font = Outfit({ subsets: ['latin'], display: 'swap' });

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
    <html lang="id" className="dark">
      <body className={`${font.className} min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 selection:bg-cyan-500/30 selection:text-white`}>
        
        {/* SIDEBAR NAVIGATION (DESKTOP) */}
        <aside className="hidden md:flex flex-col w-72 glass-panel m-4 rounded-3xl p-6 flex-shrink-0 relative overflow-hidden z-20">
          <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none"></div>
          <div className="text-3xl font-black mb-10 pb-6 border-b border-white/10 tracking-tight relative z-10 flex items-center gap-2">
            <span className="text-cyan-400">⚡</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">WarekCargo</span>
          </div>
          <nav className="flex flex-col gap-2 relative z-10">
            <Link href="/" className="px-5 py-4 rounded-2xl hover:bg-white/10 transition-all text-slate-300 hover:text-white hover:pl-7 group flex items-center gap-4 border border-transparent hover:border-white/5">
              <span className="text-xl group-hover:drop-shadow-[0_0_8px_white] transition-all">🏠</span> 
              <span className="font-semibold tracking-wide">Nexus (Home)</span>
            </Link>
            <Link href="/intake" className="px-5 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.1)] flex items-center gap-4 mt-2 mb-2 group cursor-pointer">
              <span className="text-xl group-hover:scale-110 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-transform">➕</span> 
              <span className="font-bold tracking-wide">Portal Terima</span>
            </Link>
            <Link href="/packages" className="px-5 py-4 rounded-2xl hover:bg-white/10 transition-all text-slate-300 hover:text-white hover:pl-7 group flex items-center gap-4 border border-transparent hover:border-white/5">
              <span className="text-xl group-hover:drop-shadow-[0_0_8px_white] transition-all">📦</span> 
              <span className="font-semibold tracking-wide">Data Scanner</span>
            </Link>
            <Link href="/batches" className="px-5 py-4 rounded-2xl hover:bg-white/10 transition-all text-slate-300 hover:text-white hover:pl-7 group flex items-center gap-4 border border-transparent hover:border-white/5">
              <span className="text-xl group-hover:drop-shadow-[0_0_8px_white] transition-all">🚢</span> 
              <span className="font-semibold tracking-wide">Fleet Voyage</span>
            </Link>
          </nav>
          <div className="mt-auto pt-6 border-t border-white/5 text-xs text-slate-500 font-medium flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
             System Online
          </div>
        </aside>

        {/* CONTAINER KONTEN UTAMA */}
        <main className="flex-1 w-full overflow-y-auto relative z-10">
          {/* HEADER (MOBILE) */}
          <header className="md:hidden glass-panel rounded-b-3xl p-5 sticky top-0 z-30 flex justify-between items-center mx-2 mt-0 border-t-0">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 tracking-tight flex items-center gap-2">
               <span>⚡</span> WarekCargo
            </h1>
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold">W</div>
          </header>
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        {/* FLOATING BOTTOM NAVIGATION (MOBILE) */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 glass-panel rounded-full flex justify-around items-center p-2 z-50 text-[10px] font-bold text-slate-400 border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
          <Link href="/" className="flex flex-col items-center p-2 pt-3 hover:text-cyan-400 transition-colors w-16">
            <span className="text-2xl mb-1">🏠</span> Home
          </Link>
          <Link href="/intake" className="flex flex-col items-center p-2 relative -top-6 group">
             <div className="absolute inset-0 bg-cyan-500 rounded-full opacity-40 filter blur-xl group-hover:opacity-80 transition-opacity"></div>
             <div className="w-16 h-16 bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] border-[5px] border-slate-900 relative z-10">
               <span className="text-2xl drop-shadow-md">➕</span>
             </div>
          </Link>
          <Link href="/packages" className="flex flex-col items-center p-2 pt-3 hover:text-cyan-400 transition-colors w-16">
            <span className="text-2xl mb-1">📦</span> Data
          </Link>
          <Link href="/batches" className="flex flex-col items-center p-2 pt-3 hover:text-cyan-400 transition-colors w-16">
            <span className="text-2xl mb-1">🚢</span> Kapal
          </Link>
        </nav>
      </body>
    </html>
  );
}
