import type { MarketplaceSearchParams } from './marketplace.types';

type RawSearchParams = Record<string, string | string[] | undefined>;

const supportedKeys: Array<keyof MarketplaceSearchParams> = [
  'fuelType',
  'location',
  'maxPrice',
  'minPrice',
  'page',
  'pickupDate',
  'query',
  'returnDate',
  'seats',
  'sort',
  'transmission',
  'type',
];

export function normalizeSearchParams(
  raw: RawSearchParams,
): MarketplaceSearchParams {
  const normalized: Record<string, string> = {};

  for (const key of supportedKeys) {
    const value = raw[key];
    const firstValue = Array.isArray(value) ? value[0] : value;

    if (firstValue?.trim()) {
      normalized[key] = firstValue.trim();
    }
  }

  return normalized as MarketplaceSearchParams;
}

export function createMarketplaceHref(
  filters: MarketplaceSearchParams,
  changes: Partial<MarketplaceSearchParams>,
): string {
  const query = new URLSearchParams();
  const merged = { ...filters, ...changes };

  for (const key of supportedKeys) {
    const value = merged[key];

    if (value) {
      query.set(key, value);
    }
  }

  const search = query.toString();
  return search ? `/buscar?${search}` : '/buscar';
}
