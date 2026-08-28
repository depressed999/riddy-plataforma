import type { Metadata } from 'next';

import { HostVehiclesPage } from '@/features/hosts/host-vehicles-page';

export const metadata: Metadata = {
  title: 'Meus veículos | Riddy',
};

export default function Page() {
  return <HostVehiclesPage />;
}
