import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function BatchDeprecatedDetailPage({ params }: { params: { id: string } }) {
   const { id } = await params;
   
   // Temuan 2: Halaman batches lawas dihapus dan diarahkan ke rute kanonikal /manifests/[id] 
   // beserta hierarki multi-kontainernya
   redirect(`/manifests/${id}`);
}
