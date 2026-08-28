'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { VehicleSort } from './marketplace.types';

export function MarketplaceSort({ value }: { value: VehicleSort }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(sort: VehicleSort): void {
    const next = new URLSearchParams(searchParams.toString());
    next.set('sort', sort);
    next.delete('page');
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        Ordenar por
      </span>
      <Select onValueChange={handleChange} value={value}>
        <SelectTrigger aria-label="Ordenar veículos" className="w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Mais recentes</SelectItem>
          <SelectItem value="price_asc">Menor preço</SelectItem>
          <SelectItem value="price_desc">Maior preço</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
