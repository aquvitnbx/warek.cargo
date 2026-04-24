'use client';

import { useState } from 'react';
import { removeShipmentFromContainer } from '@/app/manifests/actions';

interface DetachButtonProps {
   shipmentId: string;
   containerId: string;
   batchId: string;
   shipmentCode: string;
}

export default function ContainerDetachmentButton({ shipmentId, containerId, batchId, shipmentCode }: DetachButtonProps) {
   const [isPending, setIsPending] = useState(false);

   const handleDetach = async () => {
      if (!confirm(`Anda yakin ingin mengeluarkan Karung ${shipmentCode} dari Kontainer ini?`)) return;

      setIsPending(true);
      const fd = new FormData();
      fd.append('shipment_id', shipmentId);
      fd.append('container_id', containerId);
      fd.append('batch_id', batchId);

      try {
         const res = await removeShipmentFromContainer(fd);
         if (!res.success) {
            alert(res.message);
         }
      } catch (err: any) {
         alert(err.message || 'Gagal mengeluarkan karung.');
      } finally {
         setIsPending(false);
      }
   };

   return (
      <button 
         onClick={handleDetach}
         disabled={isPending}
         className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors disabled:opacity-50"
         title="Keluarkan Karung dari Kontainer"
      >
         {isPending ? '⏳' : 'Keluarkan'}
      </button>
   );
}
