import type { Metadata } from 'next';

import { HostDashboardPage } from '@/features/hosts/host-dashboard-page';

export const metadata: Metadata = {
  description: 'Visão geral da operação do anfitrião na Riddy.',
  title: 'Painel do anfitrião | Riddy',
};

export default function Page() {
  return <HostDashboardPage />;
}
