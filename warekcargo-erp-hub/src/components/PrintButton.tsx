'use client';

export default function PrintButton() {
  return (
    <button 
       onClick={() => window.print()} 
       className="px-5 py-2.5 bg-slate-800 hover:bg-black text-white font-bold rounded-xl shadow-[0_4px_10px_rgb(0,0,0,0.1)] flex items-center gap-2 print:hidden transition-all text-sm"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
         <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print Label Resi
    </button>
  );
}
