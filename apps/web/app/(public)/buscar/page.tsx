import { SearchX, TriangleAlert } from 'lucide-react';
import type { Metadata } from 'next';

import { Container } from '@/components/layout/container';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { MarketplaceFilters } from '@/features/marketplace/marketplace-filters';
import { MarketplacePagination } from '@/features/marketplace/marketplace-pagination';
import { MarketplaceSearchForm } from '@/features/marketplace/marketplace-search-form';
import { MarketplaceSort } from '@/features/marketplace/marketplace-sort';
import { MarketplaceVehicleCard } from '@/features/marketplace/marketplace-vehicle-card';
import { searchVehicles } from '@/features/marketplace/marketplace.service';
import type {
  MarketplaceSearchParams,
  PaginatedVehicles,
  VehicleSort,
} from '@/features/marketplace/marketplace.types';
import { normalizeSearchParams } from '@/features/marketplace/marketplace.utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  alternates: { canonical: '/buscar' },
  description:
    'Compare carros e motocicletas disponíveis para aluguel entre pessoas.',
  title: 'Buscar veículos | Riddy',
};

type MarketplacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  const filters = normalizeSearchParams(await searchParams);
  const sort = normalizeSort(filters.sort);
  let result: PaginatedVehicles | null = null;
  let failed = false;

  try {
    result = await searchVehicles({ ...filters, sort });
  } catch {
    failed = true;
  }

  return (
    <>
      <section className="border-b border-border bg-card py-8 sm:py-10">
        <Container>
          <p className="font-heading text-xs font-medium tracking-[0.14em] text-primary-strong uppercase">
            Marketplace Riddy
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
            Encontre o veículo certo para o seu caminho.
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Compare carros e motocicletas de proprietários locais com valores e
            características claras.
          </p>
          <div className="mt-7">
            <MarketplaceSearchForm filters={filters} />
          </div>
          {filters.pickupDate || filters.returnDate ? (
            <p className="mt-3 text-sm text-muted-foreground">
              As datas foram mantidas para a sua jornada. A validação de
              disponibilidade será adicionada na etapa de Reservas.
            </p>
          ) : null}
        </Container>
      </section>

      <section className="py-8 sm:py-10 lg:py-12">
        <Container>
          {failed || !result ? (
            <Alert variant="destructive">
              <TriangleAlert aria-hidden="true" className="mb-2" size={20} />
              <AlertTitle>Não foi possível carregar o catálogo</AlertTitle>
              <AlertDescription>
                Confirme se a API e o banco estão ativos e tente novamente.
              </AlertDescription>
            </Alert>
          ) : (
            <MarketplaceResults filters={filters} result={result} sort={sort} />
          )}
        </Container>
      </section>
    </>
  );
}

function MarketplaceResults({
  filters,
  result,
  sort,
}: {
  filters: MarketplaceSearchParams;
  result: PaginatedVehicles;
  sort: VehicleSort;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="font-heading text-lg font-semibold">
            {result.meta.total}{' '}
            {result.meta.total === 1
              ? 'veículo encontrado'
              : 'veículos encontrados'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filters.location
              ? `Opções em ${filters.location}`
              : 'Opções disponíveis no catálogo'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MarketplaceFilters filters={filters} variant="mobile" />
          <MarketplaceSort value={sort} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <MarketplaceFilters filters={filters} variant="desktop" />

        <div>
          {result.items.length === 0 ? (
            <EmptyState
              action={
                <Button asChild variant="secondary">
                  <a href="/buscar">Limpar busca</a>
                </Button>
              }
              description="Tente remover algum filtro ou pesquisar por outra cidade, marca ou modelo."
              icon={SearchX}
              title="Nenhum veículo encontrado"
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((vehicle) => (
                <MarketplaceVehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}

          <MarketplacePagination
            filters={filters}
            page={result.meta.page}
            totalPages={result.meta.totalPages}
          />
        </div>
      </div>
    </>
  );
}

function normalizeSort(sort?: string): VehicleSort {
  if (sort === 'price_asc' || sort === 'price_desc') {
    return sort;
  }

  return 'newest';
}
