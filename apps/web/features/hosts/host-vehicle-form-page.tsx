'use client';

import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import { useHost } from './host-provider';
import {
  createHostVehicle,
  listHostVehicles,
  updateHostVehicle,
} from './host.service';
import {
  HostPageFrame,
  HostPageHeading,
  HostPageState,
  messageFrom,
} from './host-shared';
import type { HostVehicle, HostVehicleInput } from './host.types';

export function HostVehicleFormPage({ vehicleId }: { vehicleId?: string }) {
  const { dashboard } = useHost();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<HostVehicle | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(vehicleId));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!vehicleId || !dashboard?.profile) {
      return;
    }
    let active = true;
    void listHostVehicles()
      .then((vehicles) => {
        if (!active) return;
        const found = vehicles.find((item) => item.id === vehicleId) ?? null;
        setVehicle(found);
        if (!found) setError('Veículo não encontrado.');
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
  }, [dashboard?.profile, vehicleId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input: HostVehicleInput = {
      amenities: String(formData.get('amenities') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      city: String(formData.get('city') ?? ''),
      dailyRate: Number(formData.get('dailyRate')),
      description: String(formData.get('description') ?? ''),
      fuelType: String(formData.get('fuelType') ?? ''),
      latitude: Number(formData.get('latitude')),
      longitude: Number(formData.get('longitude')),
      make: String(formData.get('make') ?? ''),
      model: String(formData.get('model') ?? ''),
      seats: Number(formData.get('seats')),
      state: String(formData.get('state') ?? ''),
      transmission: String(formData.get('transmission') ?? ''),
      type: formData.get('type') === 'motorcycle' ? 'motorcycle' : 'car',
      year: Number(formData.get('year')),
    };
    setIsSaving(true);
    setError('');
    try {
      if (vehicleId) {
        await updateHostVehicle(vehicleId, input);
      } else {
        await createHostVehicle(input);
      }
      router.push('/anfitriao/veiculos');
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <HostPageState>
      <HostPageFrame>
        <HostPageHeading
          actions={
            <Button asChild variant="secondary">
              <Link href="/anfitriao/veiculos">
                <ArrowLeft aria-hidden="true" size={17} />
                Voltar
              </Link>
            </Button>
          }
          description="Informe os dados operacionais do veículo. O endereço exato não será exibido publicamente."
          title={vehicleId ? 'Editar veículo' : 'Adicionar veículo'}
        />
        {isLoading ? (
          <Skeleton className="mt-8 h-[720px]" />
        ) : error && vehicleId && !vehicle ? (
          <Alert className="mt-8" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <form
            className="mt-8 rounded-xl border border-border bg-card p-6 sm:p-8"
            onSubmit={handleSubmit}
          >
            {error ? (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Tipo" name="type">
                <select
                  className={selectClass}
                  defaultValue={vehicle?.type ?? 'car'}
                  id="vehicle-type"
                  name="type"
                >
                  <option value="car">Carro</option>
                  <option value="motorcycle">Moto</option>
                </select>
              </Field>
              <Field label="Marca" name="make">
                <Input
                  defaultValue={vehicle?.make}
                  id="vehicle-make"
                  minLength={2}
                  name="make"
                  required
                />
              </Field>
              <Field label="Modelo" name="model">
                <Input
                  defaultValue={vehicle?.model}
                  id="vehicle-model"
                  name="model"
                  required
                />
              </Field>
              <Field label="Ano" name="year">
                <Input
                  defaultValue={vehicle?.year ?? new Date().getFullYear()}
                  id="vehicle-year"
                  max={2100}
                  min={1950}
                  name="year"
                  required
                  type="number"
                />
              </Field>
              <Field label="Diária (R$)" name="dailyRate">
                <Input
                  defaultValue={vehicle?.dailyRate}
                  id="vehicle-dailyRate"
                  min={1}
                  name="dailyRate"
                  required
                  step="0.01"
                  type="number"
                />
              </Field>
              <Field label="Lugares" name="seats">
                <Input
                  defaultValue={vehicle?.seats ?? 5}
                  id="vehicle-seats"
                  max={12}
                  min={1}
                  name="seats"
                  required
                  type="number"
                />
              </Field>
              <Field label="Câmbio" name="transmission">
                <Input
                  defaultValue={vehicle?.transmission}
                  id="vehicle-transmission"
                  name="transmission"
                  placeholder="Automático"
                  required
                />
              </Field>
              <Field label="Combustível" name="fuelType">
                <Input
                  defaultValue={vehicle?.fuelType}
                  id="vehicle-fuelType"
                  name="fuelType"
                  placeholder="Flex"
                  required
                />
              </Field>
              <Field label="Cidade" name="city">
                <Input
                  defaultValue={vehicle?.location.city}
                  id="vehicle-city"
                  name="city"
                  required
                />
              </Field>
              <Field label="Estado" name="state">
                <Input
                  className="uppercase"
                  defaultValue={vehicle?.location.state}
                  id="vehicle-state"
                  maxLength={2}
                  name="state"
                  pattern="[A-Za-z]{2}"
                  required
                />
              </Field>
              <Field label="Latitude aproximada" name="latitude">
                <Input
                  defaultValue={vehicle?.location.latitude ?? -3.119}
                  id="vehicle-latitude"
                  max={90}
                  min={-90}
                  name="latitude"
                  required
                  step="any"
                  type="number"
                />
              </Field>
              <Field label="Longitude aproximada" name="longitude">
                <Input
                  defaultValue={vehicle?.location.longitude ?? -60.0217}
                  id="vehicle-longitude"
                  max={180}
                  min={-180}
                  name="longitude"
                  required
                  step="any"
                  type="number"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Descrição" name="description">
                  <Textarea
                    defaultValue={vehicle?.description}
                    id="vehicle-description"
                    maxLength={2000}
                    minLength={30}
                    name="description"
                    required
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Comodidades, separadas por vírgula"
                  name="amenities"
                >
                  <Input
                    defaultValue={vehicle?.amenities.join(', ')}
                    id="vehicle-amenities"
                    name="amenities"
                    placeholder="Ar-condicionado, Bluetooth, Câmera de ré"
                  />
                </Field>
              </div>
            </div>
            <div className="mt-7 flex justify-end border-t border-border pt-6">
              <Button disabled={isSaving} size="lg">
                {isSaving ? (
                  <Loader2
                    aria-hidden="true"
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  <Save aria-hidden="true" size={18} />
                )}
                {isSaving ? 'Salvando...' : 'Salvar rascunho'}
              </Button>
            </div>
          </form>
        )}
      </HostPageFrame>
    </HostPageState>
  );
}

const selectClass =
  'flex h-12 w-full rounded-md border border-input bg-card px-4 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';

function Field({
  children,
  label,
  name,
}: {
  children: React.ReactNode;
  label: string;
  name: string;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block font-heading text-sm font-medium"
        htmlFor={`vehicle-${name}`}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
