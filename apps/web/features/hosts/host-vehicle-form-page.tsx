'use client';

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Camera,
  Loader2,
  Save,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import { useHost } from './host-provider';
import {
  createHostVehicle,
  deleteHostVehicleImage,
  listHostVehicles,
  reorderHostVehicleImages,
  setHostVehicleImageCover,
  updateHostVehicle,
  uploadHostVehicleImage,
} from './host.service';
import {
  HostPageFrame,
  HostPageHeading,
  HostPageState,
  messageFrom,
} from './host-shared';
import type { HostVehicle, HostVehicleInput } from './host.types';
import { hostVehicleImageUrl } from '@/lib/vehicle-image-url';

const maximumImages = 10;
const maximumImageSize = 8 * 1024 * 1024;
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function HostVehicleFormPage({ vehicleId }: { vehicleId?: string }) {
  const { dashboard } = useHost();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<HostVehicle | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(vehicleId));
  const [isSaving, setIsSaving] = useState(false);
  const [imageBusyId, setImageBusyId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
      const persistedVehicleId = vehicleId ?? vehicle?.id;
      let savedVehicle = persistedVehicleId
        ? await updateHostVehicle(persistedVehicleId, input)
        : await createHostVehicle(input);
      setVehicle(savedVehicle);
      for (const file of pendingFiles) {
        savedVehicle = await uploadHostVehicleImage(
          savedVehicle.id,
          file,
          `${input.make.trim()} ${input.model.trim()} - foto ${savedVehicle.images.length + 1}`,
        );
        setVehicle(savedVehicle);
        setPendingFiles((current) =>
          current.filter((candidate) => candidate !== file),
        );
      }
      router.push('/anfitriao/veiculos');
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setIsSaving(false);
    }
  }

  function selectImages(event: ChangeEvent<HTMLInputElement>): void {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selected.length === 0) return;
    const invalidType = selected.find(
      (file) => !acceptedImageTypes.has(file.type),
    );
    if (invalidType) {
      setError('Envie apenas fotos JPG, PNG ou WebP.');
      return;
    }
    const oversized = selected.find((file) => file.size > maximumImageSize);
    if (oversized) {
      setError('Cada foto pode ter no máximo 8 MB.');
      return;
    }
    const existingCount = vehicle?.images.length ?? 0;
    if (existingCount + pendingFiles.length + selected.length > maximumImages) {
      setError(`Cada veículo pode ter no máximo ${maximumImages} fotos.`);
      return;
    }
    setError('');
    setPendingFiles((current) => [...current, ...selected]);
  }

  async function setCover(imageId: string): Promise<void> {
    if (!vehicle) return;
    setImageBusyId(imageId);
    setError('');
    try {
      setVehicle(await setHostVehicleImageCover(vehicle.id, imageId));
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setImageBusyId(null);
    }
  }

  async function removeImage(imageId: string): Promise<void> {
    if (!vehicle || !window.confirm('Remover esta foto do veículo?')) return;
    setImageBusyId(imageId);
    setError('');
    try {
      setVehicle(await deleteHostVehicleImage(vehicle.id, imageId));
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setImageBusyId(null);
    }
  }

  async function moveImage(imageId: string, direction: -1 | 1): Promise<void> {
    if (!vehicle) return;
    const ordered = [...vehicle.images].sort(
      (first, second) => first.sortOrder - second.sortOrder,
    );
    const currentIndex = ordered.findIndex((image) => image.id === imageId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
      return;
    }
    [ordered[currentIndex], ordered[targetIndex]] = [
      ordered[targetIndex]!,
      ordered[currentIndex]!,
    ];
    setImageBusyId(imageId);
    setError('');
    try {
      setVehicle(
        await reorderHostVehicleImages(
          vehicle.id,
          ordered.map((image) => image.id),
        ),
      );
    } catch (caughtError) {
      setError(messageFrom(caughtError));
    } finally {
      setImageBusyId(null);
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
          title={vehicleId || vehicle ? 'Editar veículo' : 'Adicionar veículo'}
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
              <div className="sm:col-span-2 rounded-lg border border-border bg-muted/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">
                      Fotos do veículo
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Adicione até 10 fotos JPG, PNG ou WebP de no máximo 8 MB.
                      A primeira foto será definida como capa automaticamente.
                    </p>
                  </div>
                  <Button asChild size="sm" variant="secondary">
                    <label className="cursor-pointer" htmlFor="vehicle-images">
                      <Camera aria-hidden="true" size={17} />
                      Selecionar fotos
                    </label>
                  </Button>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    id="vehicle-images"
                    multiple
                    onChange={selectImages}
                    type="file"
                  />
                </div>

                {vehicle?.images.length || pendingFiles.length ? (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...(vehicle?.images ?? [])]
                      .sort(
                        (first, second) => first.sortOrder - second.sortOrder,
                      )
                      .map((image, index, images) => (
                        <div
                          className="overflow-hidden rounded-md border border-border bg-card"
                          key={image.id}
                        >
                          <div className="relative aspect-[4/3] bg-muted">
                            <Image
                              alt={image.altText}
                              className="object-cover"
                              fill
                              sizes="(max-width: 640px) 100vw, 320px"
                              src={hostVehicleImageUrl(vehicle!.id, image)}
                              unoptimized
                            />
                            {image.isCover ? (
                              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-slate-950/75 px-2 py-1 text-xs font-medium text-white">
                                <Star aria-hidden="true" size={13} /> Capa
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center justify-between gap-1 p-2">
                            <Button
                              disabled={Boolean(imageBusyId) || image.isCover}
                              onClick={() => void setCover(image.id)}
                              size="sm"
                              title="Definir como capa"
                              type="button"
                              variant="ghost"
                            >
                              <Star aria-hidden="true" size={15} />
                              Capa
                            </Button>
                            <div className="flex">
                              <Button
                                disabled={Boolean(imageBusyId) || index === 0}
                                onClick={() => void moveImage(image.id, -1)}
                                size="icon"
                                title="Mover para a esquerda"
                                type="button"
                                variant="ghost"
                              >
                                <ArrowUp aria-hidden="true" size={15} />
                              </Button>
                              <Button
                                disabled={
                                  Boolean(imageBusyId) ||
                                  index === images.length - 1
                                }
                                onClick={() => void moveImage(image.id, 1)}
                                size="icon"
                                title="Mover para a direita"
                                type="button"
                                variant="ghost"
                              >
                                <ArrowDown aria-hidden="true" size={15} />
                              </Button>
                              <Button
                                disabled={Boolean(imageBusyId)}
                                onClick={() => void removeImage(image.id)}
                                size="icon"
                                title="Remover foto"
                                type="button"
                                variant="ghost"
                              >
                                {imageBusyId === image.id ? (
                                  <Loader2 className="animate-spin" size={15} />
                                ) : (
                                  <Trash2 aria-hidden="true" size={15} />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {pendingFiles.map((file, index) => (
                      <PendingImagePreview
                        file={file}
                        key={`${file.name}-${file.lastModified}-${index}`}
                        onRemove={() =>
                          setPendingFiles((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-md border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma foto selecionada. O veículo só poderá ser publicado
                    depois que você adicionar pelo menos uma imagem.
                  </div>
                )}
              </div>
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
              <Button disabled={isSaving || Boolean(imageBusyId)} size="lg">
                {isSaving ? (
                  <Loader2
                    aria-hidden="true"
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  <Save aria-hidden="true" size={18} />
                )}
                {isSaving
                  ? pendingFiles.length
                    ? 'Salvando e enviando fotos...'
                    : 'Salvando...'
                  : pendingFiles.length
                    ? 'Salvar veículo e fotos'
                    : 'Salvar rascunho'}
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

function PendingImagePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl] = useState(() => URL.createObjectURL(file));

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <div className="overflow-hidden rounded-md border border-dashed border-primary bg-card">
      <div className="relative aspect-[4/3] bg-muted">
        {previewUrl ? (
          // A URL temporária existe apenas no navegador e não passa pelo otimizador.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={`Prévia de ${file.name}`}
            className="h-full w-full object-cover"
            src={previewUrl}
          />
        ) : null}
        <span className="absolute top-2 left-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
          Nova foto
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 p-2">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {file.name}
        </p>
        <Button
          onClick={onRemove}
          size="icon"
          title="Remover da seleção"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" size={15} />
        </Button>
      </div>
    </div>
  );
}
