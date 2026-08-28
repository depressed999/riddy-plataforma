'use client';

import { CalendarPlus, Loader2, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { useHost } from './host-provider';
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  listAvailabilityBlocks,
  listHostVehicles,
} from './host.service';
import {
  HostPageFrame,
  HostPageHeading,
  HostPageState,
  messageFrom,
} from './host-shared';
import type { HostAvailabilityBlock, HostVehicle } from './host.types';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

export function HostCalendarPage() {
  const { dashboard } = useHost();
  const [blocks, setBlocks] = useState<HostAvailabilityBlock[]>([]);
  const [vehicles, setVehicles] = useState<HostVehicle[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!dashboard?.profile) return;
    let active = true;
    void Promise.all([listAvailabilityBlocks(), listHostVehicles()])
      .then(([blockResponse, vehicleResponse]) => {
        if (active) {
          setBlocks(blockResponse);
          setVehicles(vehicleResponse);
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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const block = await createAvailabilityBlock({
        endDate: String(formData.get('endDate') ?? ''),
        reason: String(formData.get('reason') ?? ''),
        startDate: String(formData.get('startDate') ?? ''),
        vehicleId: String(formData.get('vehicleId') ?? ''),
      });
      setBlocks((current) =>
        [...current, block].sort((a, b) =>
          a.startDate.localeCompare(b.startDate),
        ),
      );
      form.reset();
      setSuccess('Período bloqueado e removido da disponibilidade pública.');
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(blockId: string) {
    setBusyId(blockId);
    setError('');
    try {
      await deleteAvailabilityBlock(blockId);
      setBlocks((current) => current.filter((block) => block.id !== blockId));
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
          description="Bloqueie manutenção, uso pessoal ou qualquer período em que seu veículo não possa ser reservado."
          title="Calendário"
        />
        {error ? (
          <Alert className="mt-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {success ? (
          <Alert className="mt-6" variant="success">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        ) : null}
        {isLoading ? (
          <Skeleton className="mt-8 h-96" />
        ) : vehicles.length === 0 ? (
          <EmptyState
            className="mt-8"
            description="Cadastre um veículo antes de organizar períodos indisponíveis."
            icon={CalendarPlus}
            title="Calendário ainda vazio"
          />
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <form
              className="h-fit rounded-xl border border-border bg-card p-6"
              onSubmit={handleCreate}
            >
              <h2 className="font-heading text-lg font-semibold">
                Bloquear período
              </h2>
              <div className="mt-5 grid gap-4">
                <Field label="Veículo" name="vehicleId">
                  <select
                    className={selectClass}
                    id="calendar-vehicleId"
                    name="vehicleId"
                    required
                  >
                    <option value="">Selecione</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Início" name="startDate">
                  <Input
                    id="calendar-startDate"
                    min={new Date().toISOString().slice(0, 10)}
                    name="startDate"
                    required
                    type="date"
                  />
                </Field>
                <Field label="Fim" name="endDate">
                  <Input
                    id="calendar-endDate"
                    min={new Date().toISOString().slice(0, 10)}
                    name="endDate"
                    required
                    type="date"
                  />
                </Field>
                <Field label="Motivo opcional" name="reason">
                  <Input
                    id="calendar-reason"
                    maxLength={240}
                    name="reason"
                    placeholder="Manutenção preventiva"
                  />
                </Field>
                <Button disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <CalendarPlus size={17} />
                  )}
                  {isSaving ? 'Bloqueando...' : 'Bloquear datas'}
                </Button>
              </div>
            </form>

            <div>
              <h2 className="font-heading text-lg font-semibold">
                Próximos bloqueios
              </h2>
              {blocks.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Nenhum período bloqueado.
                </p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {blocks.map((block) => (
                    <Card key={block.id}>
                      <CardContent className="flex items-center justify-between gap-4 py-5">
                        <div>
                          <h3 className="font-heading font-semibold">
                            {block.vehicle.make} {block.vehicle.model}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(block.startDate)} até{' '}
                            {formatDate(block.endDate)}
                          </p>
                          {block.reason ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {block.reason}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          aria-label="Remover bloqueio"
                          disabled={Boolean(busyId)}
                          onClick={() => void handleDelete(block.id)}
                          size="icon"
                          variant="ghost"
                        >
                          {busyId === block.id ? (
                            <Loader2 className="animate-spin" size={17} />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
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
        htmlFor={`calendar-${name}`}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T12:00:00`));
}
