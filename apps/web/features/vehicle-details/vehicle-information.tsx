import {
  BadgeCheck,
  Bike,
  CalendarDays,
  CarFront,
  Check,
  Fuel,
  Gauge,
  MapPin,
  MessageSquare,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import type { Vehicle } from '@/features/marketplace/marketplace.types';

export function VehicleInformation({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="space-y-10">
      <section aria-labelledby="about-vehicle">
        <SectionHeading id="about-vehicle">Sobre este veículo</SectionHeading>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
          {vehicle.description}
        </p>
      </section>

      <section aria-labelledby="vehicle-characteristics">
        <SectionHeading id="vehicle-characteristics">
          Características
        </SectionHeading>
        <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 xl:grid-cols-3">
          <Characteristic
            icon={vehicle.type === 'car' ? CarFront : Bike}
            label="Categoria"
            value={vehicle.type === 'car' ? 'Carro' : 'Motocicleta'}
          />
          <Characteristic
            icon={CalendarDays}
            label="Ano"
            value={String(vehicle.year)}
          />
          <Characteristic
            icon={Gauge}
            label="Câmbio"
            value={vehicle.transmission}
          />
          <Characteristic
            icon={Fuel}
            label="Combustível"
            value={vehicle.fuelType}
          />
          <Characteristic
            icon={UsersRound}
            label="Lugares"
            value={String(vehicle.seats)}
          />
          <Characteristic
            icon={MapPin}
            label="Retirada"
            value={`${vehicle.location.city}, ${vehicle.location.state}`}
          />
        </dl>
      </section>

      <section aria-labelledby="vehicle-amenities">
        <SectionHeading id="vehicle-amenities">Comodidades</SectionHeading>
        {vehicle.amenities.length > 0 ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {vehicle.amenities.map((amenity) => (
              <li className="flex items-center gap-3 text-sm" key={amenity}>
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check aria-hidden="true" size={15} strokeWidth={2.5} />
                </span>
                {amenity}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            O anfitrião ainda não cadastrou comodidades adicionais.
          </p>
        )}
      </section>

      <section aria-labelledby="vehicle-host">
        <SectionHeading id="vehicle-host">Sobre o anfitrião</SectionHeading>
        <div className="mt-4 flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-secondary font-heading text-lg font-semibold text-secondary-foreground">
            AR
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-lg font-semibold">
                Anfitrião Riddy
              </h3>
              <Badge variant="outline">
                <BadgeCheck aria-hidden="true" className="mr-1" size={14} />
                Perfil da comunidade
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              As informações públicas completas do anfitrião serão exibidas
              quando o domínio de perfis estiver disponível.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="vehicle-location">
        <SectionHeading id="vehicle-location">Localização</SectionHeading>
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex min-h-48 items-center justify-center bg-muted p-6 text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                <MapPin aria-hidden="true" size={22} />
              </span>
              <p className="mt-4 font-heading text-lg font-semibold">
                {vehicle.location.city}, {vehicle.location.state}
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                A região aproximada é exibida para proteger a privacidade do
                anfitrião. O ponto de retirada será confirmado na reserva.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="vehicle-reviews">
        <SectionHeading id="vehicle-reviews">Avaliações</SectionHeading>
        <EmptyState
          className="mt-4"
          description="As avaliações aparecerão aqui depois das primeiras locações concluídas."
          icon={MessageSquare}
          title="Ainda não há avaliações publicadas"
        />
      </section>
    </div>
  );
}

function Characteristic({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-card p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-primary-strong">
        <Icon aria-hidden="true" size={19} />
      </span>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-heading text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

function SectionHeading({ children, id }: { children: ReactNode; id: string }) {
  return (
    <h2
      className="font-heading text-2xl font-semibold tracking-[-0.02em]"
      id={id}
    >
      {children}
    </h2>
  );
}
