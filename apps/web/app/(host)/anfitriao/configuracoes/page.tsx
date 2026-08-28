import type { Metadata } from 'next';

import { HostSettingsPage } from '@/features/hosts/host-settings-page';

export const metadata: Metadata = {
  title: 'Configurações do anfitrião | Riddy',
};

export default function Page() {
  return <HostSettingsPage />;
}
