import { submitIncomingPackage } from './actions';

export default function HubDashboard() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mb-2">
           <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">⚡</span> Intake Scanner
        </h1>
        <p className="text-sm font-medium text-slate-400 border-b border-white/5 pb-4 mb-6">
          Pindai paket, tangkap gambar S3, dan konsolidasikan ke Gudang Jakarta.
        </p>

        <form action={submitIncomingPackage} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold text-cyan-300 uppercase tracking-widest mb-2">Resi Ekspedisi Lokal (Tracking No)</label>
            <input 
              type="text" 
              name="tracking_number" 
              required 
              placeholder="Contoh: JX291938194..." 
              className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl font-mono text-cyan-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kurir / Pengirim (Opsional)</label>
            <input 
              type="text" 
              name="sender_name" 
              placeholder="JNE, AnterAja, atau nama penantar" 
              className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deskripsi Barang (Opsional)</label>
            <textarea 
              name="item_description" 
              placeholder="Kondisi kotak, warna, ciri-ciri..."
              rows={2}
              className="w-full p-4 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner resize-none"
            ></textarea>
          </div>

          <div className="p-5 bg-cyan-900/20 border border-cyan-500/20 rounded-2xl flex flex-col items-center justify-center border-dashed group hover:bg-cyan-900/30 transition-colors cursor-pointer">
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">📸</span>
            <span className="text-sm font-bold text-cyan-300">Ambil Foto / Unggah ke S3</span>
            <input type="file" name="package_photo" accept="image/*" capture="environment" className="mt-4 text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/40 cursor-pointer w-full max-w-xs" />
          </div>

          <button 
            type="submit" 
            className="w-full p-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all outline-none"
          >
            TERIMA PAKET
          </button>
        </form>
      </div>

    </div>
  );
}
