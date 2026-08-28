'use client';

import { CalendarDays, MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { MarketplaceSearchParams } from './marketplace.types';

export function MarketplaceSearchForm({
  filters,
}: {
  filters: MarketplaceSearchParams;
}) {
  const router = useRouter();

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
      className="grid gap-3 rounded-lg border border-border bg-card p-4 lg:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_auto]"
      method="get"
      onSubmit={handleSubmit}
    >
      <SearchField
        defaultValue={filters.query}
        icon={Search}
        label="Marca ou modelo"
        name="query"
        placeholder="Ex.: Tesla ou Civic"
      />
      <SearchField
        defaultValue={filters.location}
        icon={MapPin}
        label="Local de retirada"
        name="location"
        placeholder="Cidade ou estado"
      />
      <SearchField
        defaultValue={filters.pickupDate}
        icon={CalendarDays}
        label="Retirada"
        name="pickupDate"
        type="date"
      />
      <SearchField
        defaultValue={filters.returnDate}
        icon={CalendarDays}
        label="Devolução"
        name="returnDate"
        type="date"
      />

      {filters.type ? (
        <input name="type" type="hidden" value={filters.type} />
      ) : null}
      {filters.transmission ? (
        <input name="transmission" type="hidden" value={filters.transmission} />
      ) : null}
      {filters.fuelType ? (
        <input name="fuelType" type="hidden" value={filters.fuelType} />
      ) : null}
      {filters.seats ? (
        <input name="seats" type="hidden" value={filters.seats} />
      ) : null}
      {filters.minPrice ? (
        <input name="minPrice" type="hidden" value={filters.minPrice} />
      ) : null}
      {filters.maxPrice ? (
        <input name="maxPrice" type="hidden" value={filters.maxPrice} />
      ) : null}
      {filters.sort ? (
        <input name="sort" type="hidden" value={filters.sort} />
      ) : null}

      <Button className="h-14 px-6" size="lg" type="submit">
        <Search aria-hidden="true" size={18} />
        Buscar
      </Button>
    </form>
  );
}

function SearchField({
  defaultValue,
  icon: Icon,
  label,
  name,
  placeholder,
  type = 'text',
}: {
  defaultValue?: string;
  icon: typeof Search;
  label: string;
  name: string;
  placeholder?: string;
  type?: 'date' | 'text';
}) {
  return (
    <div>
      <label
        className="mb-1.5 block font-heading text-xs font-medium text-muted-foreground"
        htmlFor={`marketplace-${name}`}
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          className="h-14 bg-muted pr-3 pl-11"
          defaultValue={defaultValue}
          id={`marketplace-${name}`}
          name={name}
          placeholder={placeholder}
          type={type}
        />
      </div>
    </div>
  );
}
