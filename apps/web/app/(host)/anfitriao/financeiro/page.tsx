import type { Metadata } from 'next';

import { HostFinancePage } from '@/features/hosts/host-finance-page';

export const metadata: Metadata = { title: 'Financeiro do anfitrião | Riddy' };

export default function Page() {
  return <HostFinancePage />;
}
