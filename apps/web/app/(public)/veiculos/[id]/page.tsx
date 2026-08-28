import { ArrowLeft, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { Container } from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { getVehicle } from '@/features/marketplace/marketplace.service';
import { ReservationPanel } from '@/features/vehicle-details/reservation-panel';
import { VehicleGallery } from '@/features/vehicle-details/vehicle-gallery';
import { VehicleInformation } from '@/features/vehicle-details/vehicle-information';

export const dynamic = 'force-dynamic';

const getCachedVehicle = cache(getVehicle);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getCachedVehicle(id);
  if (!vehicle) {
    return {
      robots: { follow: false, index: false },
      title: 'Veículo não encontrado | Riddy',
    };
  }
  const name = `${vehicle.make} ${vehicle.model}`;
  const description = `${name} ${vehicle.year} para aluguel em ${vehicle.location.city}, ${vehicle.location.state}.`;
  const cover =
    vehicle.images.find((image) => image.isCover) ?? vehicle.images[0];

  return {
    alternates: { canonical: `/veiculos/${vehicle.id}` },
    description,
    openGraph: {
      description,
      ...(cover
        ? { images: [{ alt: cover.altText, url: `/${cover.storageKey}` }] }
        : {}),
      title: `${name} | Riddy`,
      type: 'website',
      url: `/veiculos/${vehicle.id}`,
    },
    title: `${name} | Riddy`,
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getCachedVehicle(id);

  if (!vehicle) {
    notFound();
  }

  return (
    <Container className="py-6 sm:py-8 lg:py-10">
      <nav aria-label="Navegação estrutural" className="mb-6">
        <Link
          className="inline-flex items-center gap-2 font-heading text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          href="/buscar"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Voltar ao catálogo
        </Link>
      </nav>

      <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">
              {vehicle.type === 'car' ? 'Carro' : 'Motocicleta'}
            </Badge>
            <Badge variant="outline">{vehicle.year}</Badge>
          </div>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            {vehicle.make} {vehicle.model}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin aria-hidden="true" size={17} />
            {vehicle.location.city}, {vehicle.location.state}
          </p>
        </div>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground sm:text-right">
          Informações transparentes para você decidir com tranquilidade.
        </p>
      </header>

      <VehicleGallery vehicle={vehicle} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-14">
        <div className="order-2 lg:order-1">
          <VehicleInformation vehicle={vehicle} />
        </div>
        <div className="order-1 lg:order-2">
          <ReservationPanel
            dailyRate={vehicle.dailyRate}
            vehicleId={vehicle.id}
          />
        </div>
      </div>
    </Container>
  );
}
