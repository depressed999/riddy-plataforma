import type { Metadata } from 'next';

import { KycReviewPageContent } from '@/features/kyc/kyc-review-page-content';

export const metadata: Metadata = {
  description: 'Fila protegida para análise de documentos na Riddy.',
  robots: { follow: false, index: false },
  title: 'Análises KYC',
};

export default function KycReviewPage() {
  return <KycReviewPageContent />;
}
