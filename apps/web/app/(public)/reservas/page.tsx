import type { Metadata } from 'next';

import { BookingsPageContent } from '@/features/bookings/bookings-page-content';

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Minhas reservas | Riddy',
};

export default function BookingsPage() {
  return <BookingsPageContent />;
}
