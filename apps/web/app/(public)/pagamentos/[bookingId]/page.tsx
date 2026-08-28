import type { Metadata } from 'next';

import { PaymentPageContent } from '@/features/payments/payment-page-content';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Pagamento | Riddy',
};

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <PaymentPageContent bookingId={bookingId} />;
}
