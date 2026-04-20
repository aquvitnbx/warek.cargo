'use client';

import { useState, useRef } from 'react';

export default function TrackingInputWithScanner() {
  const [value, setValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setDebugLog(prev => [...prev, msg]);
  };

  const handleScanClick = () => {
    // Bukti nyata bahwa tombol ditekan
    alert("Berhasil! Tombol SCAN dari HP sukses bereaksi (Hydration JS aktif).");
    
    addLog('Tombol SCAN ditekan');
    setIsScanning(!isScanning);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog('File foto dipilih: ' + file.name);
    try {
      addLog('Mengimpor module ZXing secara dinamis...');
      // Mengimpor library secara dinamis HANYA JIKA foto sudah diambil, mencegah crash di awal
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      const reader = new BrowserMultiFormatReader();
      
      const url = URL.createObjectURL(file);
      addLog('Menjalankan decoding barcode...');
      const result = await reader.decodeFromImageUrl(url);
      
      if (result) {
         addLog('BERHASIL! Barcode: ' + result.getText());
         setValue(result.getText());
         // Bunyi beep otomatis jika ada
         try {
           const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
           const ctx = new AudioContext();
           const osc = ctx.createOscillator();
           osc.connect(ctx.destination);
           osc.frequency.value = 1000;
           osc.start();
           setTimeout(() => osc.stop(), 100);
         } catch(err) {}

         setTimeout(() => setIsScanning(false), 1500);
      }
    } catch (err: any) {
      addLog('GAGAL SCAN: ' + (err.message || 'Barcode buram/tidak terbaca. Ketik manual.'));
    }
  };

  return (
    <>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
        Resi Ekspedisi (Tracking No.)
      </label>
      
      {isScanning && (
        <div className="bg-slate-900 rounded-2xl overflow-hidden mb-4 shadow-2xl border-4 border-yellow-400 w-full animate-in fade-in duration-300">
           <div className="flex items-center justify-between p-4 bg-slate-800">
              <span className="text-yellow-400 font-bold text-xs uppercase tracking-widest">Panel Kamera Darurat</span>
              <button type="button" onClick={() => setIsScanning(false)} className="text-slate-400 hover:text-white font-black text-xl px-3 border border-slate-600 rounded">
                TUTUP
              </button>
           </div>

           <div className="pt-8 pb-8 px-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-4xl">📸</div>
              <p className="text-white text-xs font-medium">Arahkan kamera ke barcode/resi.</p>
              
              <button 
                type="button" 
                onClick={() => {
                  addLog('Tombol (Buka Kamera) ditekan.');
                  fileInputRef.current?.click();
                }}
                className="mt-4 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black uppercase tracking-widest rounded-xl text-sm transition-all"
              >
                 Buka Kamera & Jepret (Aman)
              </button>
              <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
           </div>

           {/* KOTAK DEBUG LOGGING */}
           {debugLog.length > 0 && (
             <div className="bg-black p-4 border-t border-slate-700">
               <p className="text-[9px] text-green-400 font-mono mb-2 uppercase">System Log Terminal:</p>
               <ul className="text-left text-[10px] space-y-1 font-mono text-slate-300">
                 {debugLog.map((log, idx) => (
                   <li key={idx}>&gt; {log}</li>
                 ))}
               </ul>
             </div>
           )}
        </div>
      )}

      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
             </svg>
          </div>
          <input 
            type="text" 
            name="tracking_number" 
            required 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Contoh: JX29..." 
            className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-mono text-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-black tracking-wider uppercase shadow-inner"
          />
        </div>
        <button
          type="button"
          onClick={handleScanClick}
          className="w-20 sm:w-24 bg-blue-100 hover:bg-transparent text-blue-700 font-black rounded-2xl flex flex-col items-center justify-center transition-colors border-[3px] border-blue-500 focus:outline-none active:bg-blue-200"
        >
          <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
          <span className="text-[10px] uppercase tracking-widest leading-none">SCAN</span>
        </button>
      </div>
    </>
  );
}
