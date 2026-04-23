import { redirect } from 'next/navigation';

export const revalidate = 0;

export default function BatchesDeprecatedPage() {
   // Temuan 2: Halaman batches lawas dihapus dan diubah menjadi redirect ke rute kanonikal /manifests
   redirect('/manifests');
}
