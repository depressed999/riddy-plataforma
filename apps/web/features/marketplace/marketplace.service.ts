import type {
  MarketplaceSearchParams,
  PaginatedVehicles,
  Vehicle,
} from './marketplace.types';

const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

export async function searchVehicles(
  filters: MarketplaceSearchParams,
  pageSize = 6,
): Promise<PaginatedVehicles> {
  const query = new URLSearchParams();

  append(query, 'fuelType', filters.fuelType);
  append(query, 'location', filters.location);
  append(query, 'maxPrice', filters.maxPrice);
  append(query, 'minPrice', filters.minPrice);
  append(query, 'page', filters.page ?? '1');
  append(query, 'query', filters.query);
  append(query, 'seats', filters.seats);
  append(query, 'sort', filters.sort ?? 'newest');
  append(query, 'transmission', filters.transmission);
  append(query, 'type', filters.type);
  query.set('pageSize', String(pageSize));

  const response = await fetch(`${apiUrl}/api/v1/vehicles?${query}`, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(
      `A busca de veículos falhou com status ${response.status}.`,
    );
  }

  return (await response.json()) as PaginatedVehicles;
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const response = await fetch(`${apiUrl}/api/v1/vehicles/${id}`, {
    next: { revalidate: 30 },
  });

  if (response.status === 404 || response.status === 400) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `A consulta do veículo falhou com status ${response.status}.`,
    );
  }

  return (await response.json()) as Vehicle;
}

function append(query: URLSearchParams, key: string, value?: string): void {
  const normalized = value?.trim();

  if (normalized) {
    query.set(key, normalized);
  }
}
