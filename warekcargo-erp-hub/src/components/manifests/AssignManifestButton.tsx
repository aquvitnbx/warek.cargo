'use client';

import { useState } from 'react';
import { assignShipmentToManifest } from '@/app/manifests/actions';

export default function AssignManifestButton({ shipmentId, batches, containers, currentBatchContainerId, shipmentDestinationCity }: { shipmentId: string, batches: any[], containers: any[], currentBatchContainerId?: string, shipmentDestinationCity?: string }) {
   const [isOpen, setIsOpen] = useState(false);
   const [selectedBatchId, setSelectedBatchId] = useState('');
   const [selectedContainerId, setSelectedContainerId] = useState('');
   const [isPending, setIsPending] = useState(false);

   const availableContainers = containers.filter(c => c.batch_id === selectedBatchId);
   
   const isAlreadyAssigned = !!currentBatchContainerId;
   const currentContainer = containers.find(c => c.id === currentBatchContainerId);
   const currentBatch = batches.find(b => b.id === currentContainer?.batch_id);

   const handleAssign = async () => {
      if (!selectedBatchId || !selectedContainerId) return alert('Pilih Armada dan Kontainer');
      const chosenContainer = containers.find(c => c.id === selectedContainerId);
      if (shipmentDestinationCity && chosenContainer?.destination_city && shipmentDestinationCity !== chosenContainer.destination_city) {
         return alert('DITOLAK KARENA MISMATCH: Karung ini ditujukan ke ' + shipmentDestinationCity + ', namun Laci Kontainer yang dipilih menuju ke ' + chosenContainer.destination_city + '.');
      }

      setIsPending(true);

      const res = await assignShipmentToManifest(shipmentId, selectedBatchId, selectedContainerId);
      if (res.success) {
         setIsOpen(false);
         // window.location.reload(); let the server action revalidatePath do the work
      } else {
         alert('Gagal: ' + res.message);
      }
      setIsPending(false);
   };

   return (
      <>
         {isAlreadyAssigned ? (
            <div className="text-right">
               <span className="bg-emerald-500 text-slate-900 font-bold px-3 py-1 text-[10px] uppercase tracking-widest rounded mb-2 inline-block shadow-sm">
                  TER-ASSIGN
               </span>
               <div className="text-sm font-black">
                  {currentContainer?.container_number} <span className="text-slate-400 font-medium">({currentBatch?.vessel_name})</span>
               </div>
               <button onClick={() => setIsOpen(true)} className="text-[10px] text-blue-300 hover:text-white underline mt-2 font-medium tracking-wide">
                  Pindah Muatan?
               </button>
            </div>
         ) : (
            <button 
               onClick={() => setIsOpen(true)}
               className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgb(37,99,235,0.4)] hover:shadow-[0_0_30px_rgb(37,99,235,0.6)] font-black tracking-widest text-sm rounded-xl transition-all"
            >
               + MASUKAN KE MUATAN 
            </button>
         )}

         {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white text-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="font-black text-lg">Pilih Rute Manifest (3-Tier)</h3>
                     <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-500 font-bold p-2">✕</button>
                  </div>
                  
                  <div className="p-6 space-y-5">
                     <div>
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">1. Pilih Jadwal Armada (Pelayaran)</label>
                        <select 
                           value={selectedBatchId}
                           onChange={(e) => {
                              setSelectedBatchId(e.target.value);
                              setSelectedContainerId(''); // reset container
                           }}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                           <option value="">-- Pilih Armada --</option>
                           {batches.map(b => (
                              <option key={b.id} value={b.id}>{b.vessel_name} (VOY: {b.voyage_number || '-'})</option>
                           ))}
                        </select>
                     </div>

                     <div className={`transition-opacity duration-300 ${!selectedBatchId && 'opacity-30 pointer-events-none'}`}>
                        <label className="block text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">2. Pilih Laci Muatan / Kontainer</label>
                        <select 
                           value={selectedContainerId}
                           onChange={(e) => setSelectedContainerId(e.target.value)}
                           className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                           <option value="">-- Pilih Kontainer / Referensi Muat --</option>
                           {availableContainers.map(c => (
                              <option key={c.id} value={c.id}>{c.container_number} ({c.container_type.replace('_', ' ')})</option>
                           ))}
                        </select>
                        {selectedBatchId && availableContainers.length === 0 && (
                           <p className="text-xs text-red-500 mt-2 font-bold">⚠️ Armada ini belum memiliki referensi kontainer sama sekali. Buat dulu di menu Jadwal Armada.</p>
                        )}
                     </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 relative">
                     {selectedContainerId && shipmentDestinationCity && containers.find(c=>c.id===selectedContainerId)?.destination_city !== shipmentDestinationCity && (
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-bold text-red-600 uppercase flex items-center gap-2">
                           ⚠️ MISMATCH DESTINASI
                        </div>
                     )}
                     <button onClick={() => setIsOpen(false)} className="px-6 py-3 font-bold text-sm tracking-widest text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">BATAL</button>
                     <button 
                        onClick={handleAssign} 
                        disabled={isPending || !selectedBatchId || !selectedContainerId || (shipmentDestinationCity && containers.find(c=>c.id===selectedContainerId)?.destination_city && containers.find(c=>c.id===selectedContainerId)?.destination_city !== shipmentDestinationCity)}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-black tracking-widest text-sm rounded-xl transition-colors shadow-sm"
                     >
                        {isPending ? 'MENGHUBUNGKAN...' : 'ASSIGN KARUNG'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </>
   );
}
