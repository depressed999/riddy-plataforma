import type { Metadata } from 'next';

import { HostVehicleFormPage } from '@/features/hosts/host-vehicle-form-page';

export const metadata: Metadata = {
  title: 'Editar veículo | Riddy',
};

export default async function Page(
  props: PageProps<'/anfitriao/veiculos/[id]/editar'>,
) {
  const { id } = await props.params;
  return <HostVehicleFormPage vehicleId={id} />;
}
