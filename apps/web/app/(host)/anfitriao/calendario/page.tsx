import type { Metadata } from 'next';

import { HostCalendarPage } from '@/features/hosts/host-calendar-page';

export const metadata: Metadata = { title: 'Calendário | Riddy' };

export default function Page() {
  return <HostCalendarPage />;
}
