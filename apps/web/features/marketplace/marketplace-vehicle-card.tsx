import { Bike, CarFront, Fuel, MapPin, UsersRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

import type { Vehicle } from './marketplace.types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  maximumFractionDigits: 0,
  style: 'currency',
});

export function MarketplaceVehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const cover =
    vehicle.images.find((image) => image.isCover) ?? vehicle.images[0];
  const typeLabel = vehicle.type === 'car' ? 'Carro' : 'Motocicleta';

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-colors duration-200 hover:border-primary-hover">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
        {cover ? (
          <Image
            alt={cover.altText}
            className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            src={`/${cover.storageKey}`}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            {vehicle.type === 'car' ? (
              <CarFront aria-hidden="true" size={42} strokeWidth={1.4} />
            ) : (
              <Bike aria-hidden="true" size={42} strokeWidth={1.4} />
            )}
            <span className="font-heading text-xs font-medium tracking-wide uppercase">
              Foto em atualização
            </span>
          </div>
        )}
        <Badge className="absolute top-3 left-3">{typeLabel}</Badge>
      </div>

      <CardContent className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-semibold">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin aria-hidden="true" size={15} />
              {vehicle.location.city}, {vehicle.location.state}
            </p>
          </div>
          <span className="rounded-md border border-border bg-muted px-2 py-1 font-heading text-xs font-medium">
            {vehicle.year}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          <VehicleFeature
            icon={Fuel}
            label="Combustível"
            value={vehicle.fuelType}
          />
          <VehicleFeature
            icon={CarFront}
            label="Câmbio"
            value={vehicle.transmission}
          />
          <VehicleFeature
            icon={UsersRound}
            label="Lugares"
            value={String(vehicle.seats)}
          />
        </dl>
      </CardContent>

      <CardFooter className="justify-between gap-4 border-t border-border p-5">
        <p>
          <span className="font-heading text-xl font-semibold">
            {currencyFormatter.format(vehicle.dailyRate)}
          </span>
          <span className="text-sm text-muted-foreground">/dia</span>
        </p>

        <Button asChild size="sm" variant="secondary">
          <Link href={`/veiculos/${vehicle.id}`}>Ver detalhes</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function VehicleFeature({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Fuel;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center justify-center gap-1 text-muted-foreground">
        <Icon aria-hidden="true" size={14} />
        <span className="sr-only">{label}</span>
      </dt>
      <dd
        className="mt-1 truncate font-heading text-xs font-medium"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
