import type { Metadata } from 'next';

import { HostVehicleFormPage } from '@/features/hosts/host-vehicle-form-page';

export const metadata: Metadata = {
  title: 'Adicionar veículo | Riddy',
};

export default function Page() {
  return <HostVehicleFormPage />;
}
