import type { Metadata } from 'next';

import { HostBookingsPage } from '@/features/hosts/host-bookings-page';

export const metadata: Metadata = { title: 'Reservas recebidas | Riddy' };

export default function Page() {
  return <HostBookingsPage />;
}
