import { submitIncomingPackage } from './actions';

export default function HubDashboard() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-2">
           <span className="text-blue-600">➕</span> Intake Scanner
        </h1>
        <p className="text-sm font-medium text-slate-500 border-b border-slate-100 pb-4 mb-6">
          Pindai paket, tangkap gambar fisik, dan konsolidasikan ke Gudang Induk.
        </p>

        <form action={submitIncomingPackage} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Resi Ekspedisi Lokal (Tracking No)</label>
            <input 
              type="text" 
              name="tracking_number" 
              required 
              placeholder="Contoh: JX29... atau ID01..." 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Kurir / Pengirim (Opsional)</label>
            <input 
              type="text" 
              name="sender_name" 
              placeholder="JNE, AnterAja, Gojek..." 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Deskripsi Barang (Opsional)</label>
            <textarea 
              name="item_description" 
              placeholder="Kondisi kotak penyok, warna lakban, ukuran raksasa..."
              rows={2}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium resize-none"
            ></textarea>
          </div>

          <div className="p-6 bg-blue-50 border-2 border-blue-200 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors">
            <span className="text-3xl mb-2">📸</span>
            <span className="text-sm font-bold text-blue-700">Ambil Foto Barcode & Bukti Fisik</span>
            <span className="text-xs text-blue-500 mt-1">Disimpan langsung ke Server Cloud AWS S3</span>
            <input type="file" name="package_photo" accept="image/*" capture="environment" className="mt-4 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer w-full max-w-xs" />
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all outline-none text-lg tracking-wide"
          >
            TERIMA PAKET SEKARANG
          </button>
        </form>
      </div>

    </div>
  );
}
