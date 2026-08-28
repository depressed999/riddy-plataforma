import type { Metadata } from 'next';

import { KycPageContent } from '@/features/kyc/kyc-page-content';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Documentos e verificação | Riddy',
};

export default function KycDocumentsPage() {
  return <KycPageContent />;
}
