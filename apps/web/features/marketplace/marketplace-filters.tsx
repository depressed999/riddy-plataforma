'use client';

import { SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import type { MarketplaceSearchParams } from './marketplace.types';
import { createMarketplaceHref } from './marketplace.utils';

export function MarketplaceFilters({
  filters,
  variant,
}: {
  filters: MarketplaceSearchParams;
  variant: 'desktop' | 'mobile';
}) {
  if (variant === 'desktop') {
    return (
      <aside className="hidden lg:block" aria-label="Filtros do catálogo">
        <div className="sticky top-24 rounded-lg border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Filtros</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Refine os resultados para a sua viagem.
          </p>
          <FilterForm filters={filters} idPrefix="desktop" />
        </div>
      </aside>
    );
  }

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary">
            <SlidersHorizontal aria-hidden="true" size={17} />
            Filtros
          </Button>
        </SheetTrigger>
        <SheetContent
          className="max-h-[92vh] overflow-y-auto rounded-t-lg"
          side="bottom"
        >
          <SheetHeader>
            <SheetTitle>Filtrar veículos</SheetTitle>
            <SheetDescription>
              Escolha as características mais importantes para você.
            </SheetDescription>
          </SheetHeader>
          <FilterForm filters={filters} idPrefix="mobile" />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterForm({
  filters,
  idPrefix,
}: {
  filters: MarketplaceSearchParams;
  idPrefix: string;
}) {
  const router = useRouter();
  const clearHref = createMarketplaceHref(filters, {
    fuelType: undefined,
    maxPrice: undefined,
    minPrice: undefined,
    page: undefined,
    seats: undefined,
    transmission: undefined,
    type: undefined,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = new URLSearchParams();

    for (const [key, rawValue] of formData.entries()) {
      const value = String(rawValue).trim();

      if (value) {
        query.set(key, value);
      }
    }

    router.push(query.size > 0 ? `/buscar?${query}` : '/buscar');
  }

  return (
    <form
      action="/buscar"
      className="mt-6 space-y-5"
      method="get"
      onSubmit={handleSubmit}
    >
      <PreservedSearchFields filters={filters} />

      <FilterSelect
        defaultValue={filters.type}
        id={`${idPrefix}-type`}
        label="Tipo de veículo"
        name="type"
        options={[
          ['', 'Todos'],
          ['car', 'Carros'],
          ['motorcycle', 'Motocicletas'],
        ]}
      />

      <FilterSelect
        defaultValue={filters.transmission}
        id={`${idPrefix}-transmission`}
        label="Câmbio"
        name="transmission"
        options={[
          ['', 'Todos'],
          ['Automático', 'Automático'],
          ['Manual', 'Manual'],
        ]}
      />

      <FilterSelect
        defaultValue={filters.fuelType}
        id={`${idPrefix}-fuel`}
        label="Combustível"
        name="fuelType"
        options={[
          ['', 'Todos'],
          ['Elétrico', 'Elétrico'],
          ['Híbrido', 'Híbrido'],
          ['Flex', 'Flex'],
          ['Gasolina', 'Gasolina'],
        ]}
      />

      <FilterSelect
        defaultValue={filters.seats}
        id={`${idPrefix}-seats`}
        label="Lugares mínimos"
        name="seats"
        options={[
          ['', 'Qualquer quantidade'],
          ['2', '2 ou mais'],
          ['5', '5 ou mais'],
        ]}
      />

      <fieldset>
        <legend className="font-heading text-sm font-medium">
          Valor da diária
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <label className="sr-only" htmlFor={`${idPrefix}-min-price`}>
              Preço mínimo
            </label>
            <Input
              defaultValue={filters.minPrice}
              id={`${idPrefix}-min-price`}
              min="0"
              name="minPrice"
              placeholder="Mínimo"
              step="10"
              type="number"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor={`${idPrefix}-max-price`}>
              Preço máximo
            </label>
            <Input
              defaultValue={filters.maxPrice}
              id={`${idPrefix}-max-price`}
              min="0"
              name="maxPrice"
              placeholder="Máximo"
              step="10"
              type="number"
            />
          </div>
        </div>
      </fieldset>

      <div className="grid gap-2 pt-1">
        <Button type="submit">Aplicar filtros</Button>
        <Button asChild type="button" variant="ghost">
          <Link href={clearHref}>Limpar filtros</Link>
        </Button>
      </div>
    </form>
  );
}

function FilterSelect({
  defaultValue,
  id,
  label,
  name,
  options,
}: {
  defaultValue?: string;
  id: string;
  label: string;
  name: string;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <label className="font-heading text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <select
        className="mt-2 flex h-12 w-full rounded-md border border-input bg-card px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
        defaultValue={defaultValue ?? ''}
        id={id}
        name={name}
      >
        {options.map(([value, optionLabel]) => (
          <option key={value || 'all'} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function PreservedSearchFields({
  filters,
}: {
  filters: MarketplaceSearchParams;
}) {
  return (
    <>
      {filters.query ? (
        <input name="query" type="hidden" value={filters.query} />
      ) : null}
      {filters.location ? (
        <input name="location" type="hidden" value={filters.location} />
      ) : null}
      {filters.pickupDate ? (
        <input name="pickupDate" type="hidden" value={filters.pickupDate} />
      ) : null}
      {filters.returnDate ? (
        <input name="returnDate" type="hidden" value={filters.returnDate} />
      ) : null}
      {filters.sort ? (
        <input name="sort" type="hidden" value={filters.sort} />
      ) : null}
    </>
  );
}
