'use client';

import {
  CarFront,
  CircleOff,
  Loader2,
  Pencil,
  Plus,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

import { useHost } from './host-provider';
import { listHostVehicles, updateHostVehicleStatus } from './host.service';
import {
  HostPageFrame,
  HostPageHeading,
  HostPageState,
  messageFrom,
} from './host-shared';
import type { HostVehicle, HostVehicleStatus } from './host.types';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
});

const statusPresentation: Record<
  HostVehicleStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'outline' }
> = {
  active: { label: 'Publicado', variant: 'success' },
  draft: { label: 'Rascunho', variant: 'outline' },
  inactive: { label: 'Inativo', variant: 'default' },
  maintenance: { label: 'Manutenção', variant: 'warning' },
};

export function HostVehiclesPage() {
  const { dashboard } = useHost();
  const [vehicles, setVehicles] = useState<HostVehicle[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!dashboard?.profile) {
      return;
    }
    let active = true;
    void listHostVehicles()
      .then((response) => {
        if (active) {
          setVehicles(response);
          setError('');
        }
      })
      .catch((caughtError: unknown) => {
        if (active) setError(messageFrom(caughtError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [dashboard?.profile]);

  async function changeStatus(
    vehicle: HostVehicle,
    status: HostVehicleStatus,
  ): Promise<void> {
    setBusyId(vehicle.id);
    setError('');
    try {
      const updated = await updateHostVehicleStatus(vehicle.id, status);
      setVehicles((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <HostPageState>
      <HostPageFrame>
        <HostPageHeading
          actions={
            <Button asChild>
              <Link href="/anfitriao/veiculos/novo">
                <Plus aria-hidden="true" size={18} />
                Adicionar veículo
              </Link>
            </Button>
          }
          description="Cadastre sua frota, prepare os anúncios e controle quando cada veículo aparece no Marketplace."
          title="Veículos"
        />
        {error ? (
          <Alert className="mt-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {isLoading ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : vehicles.length === 0 ? (
          <EmptyState
            action={
              <Button asChild>
                <Link href="/anfitriao/veiculos/novo">Cadastrar veículo</Link>
              </Button>
            }
            className="mt-8"
            description="Seu primeiro anúncio começa como rascunho e só fica público após sua confirmação."
            icon={CarFront}
            title="Nenhum veículo cadastrado"
          />
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {vehicles.map((vehicle) => {
              const status = statusPresentation[vehicle.status];
              const isBusy = busyId === vehicle.id;
              return (
                <Card key={vehicle.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          {vehicle.type === 'car' ? 'Carro' : 'Moto'} ·{' '}
                          {vehicle.year}
                        </p>
                        <h2 className="mt-1 font-heading text-xl font-semibold">
                          {vehicle.make} {vehicle.model}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {vehicle.location.city}, {vehicle.location.state}
                        </p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Diária</dt>
                        <dd className="mt-1 font-heading font-semibold">
                          {currencyFormatter.format(vehicle.dailyRate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Lugares</dt>
                        <dd className="mt-1 font-heading font-medium">
                          {vehicle.seats}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/anfitriao/veiculos/${vehicle.id}/editar`}>
                          <Pencil aria-hidden="true" size={16} />
                          Editar
                        </Link>
                      </Button>
                      {vehicle.status === 'active' ? (
                        <Button
                          disabled={isBusy || Boolean(busyId)}
                          onClick={() => void changeStatus(vehicle, 'inactive')}
                          size="sm"
                          variant="ghost"
                        >
                          {isBusy ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <CircleOff size={16} />
                          )}
                          Pausar anúncio
                        </Button>
                      ) : (
                        <Button
                          disabled={isBusy || Boolean(busyId)}
                          onClick={() => void changeStatus(vehicle, 'active')}
                          size="sm"
                        >
                          {isBusy ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <CarFront size={16} />
                          )}
                          Publicar
                        </Button>
                      )}
                      {vehicle.status !== 'maintenance' ? (
                        <Button
                          disabled={isBusy || Boolean(busyId)}
                          onClick={() =>
                            void changeStatus(vehicle, 'maintenance')
                          }
                          size="icon"
                          title="Marcar em manutenção"
                          variant="ghost"
                        >
                          <Wrench aria-hidden="true" size={16} />
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </HostPageFrame>
    </HostPageState>
  );
}
