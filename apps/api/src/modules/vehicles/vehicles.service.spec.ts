import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { PrivateStorageService } from '../kyc/private-storage.service';
import type { VehiclesRepository } from './vehicles.repository';
import type { VehiclesCacheService } from './vehicles-cache.service';
import { VehiclesService } from './vehicles.service';
import type {
  PaginatedVehicles,
  Vehicle,
  VehicleSearch,
} from './vehicles.types';

const vehicle: Vehicle = {
  amenities: ['Ar-condicionado'],
  createdAt: '2026-08-25T00:00:00.000Z',
  dailyRate: 450,
  description: 'SUV elétrico.',
  fuelType: 'Elétrico',
  id: '11111111-1111-4111-8111-111111111111',
  images: [],
  location: {
    city: 'Manaus',
    latitude: -3.119,
    longitude: -60.0217,
    state: 'AM',
  },
  make: 'Tesla',
  model: 'Model Y',
  ownerId: '99999999-9999-4999-8999-999999999999',
  seats: 5,
  status: 'active',
  transmission: 'Automático',
  type: 'car',
  updatedAt: '2026-08-25T00:00:00.000Z',
  year: 2024,
};

describe('VehiclesService', () => {
  const search = jest.fn<Promise<PaginatedVehicles>, [VehicleSearch]>();
  const findActiveById = jest.fn<Promise<Vehicle | null>, [string]>();
  const repository = {
    findActiveImage: jest.fn(),
    findActiveById,
    search,
  } as unknown as VehiclesRepository;
  const cache = {
    detail: jest.fn((_id: string, loader: () => Promise<Vehicle | null>) =>
      loader(),
    ),
    search: jest.fn(
      (_filters: VehicleSearch, loader: () => Promise<PaginatedVehicles>) =>
        loader(),
    ),
  } as unknown as VehiclesCacheService;
  const storage = {
    createViewUrl: jest.fn(),
  } as unknown as PrivateStorageService;
  const service = new VehiclesService(repository, cache, storage);
  const filters: VehicleSearch = {
    page: 1,
    pageSize: 6,
    sort: 'newest',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches active vehicles with pagination', async () => {
    const result = {
      items: [vehicle],
      meta: { page: 1, pageSize: 6, total: 1, totalPages: 1 },
    };
    search.mockResolvedValue(result);

    await expect(service.search(filters)).resolves.toEqual(result);
    expect(search).toHaveBeenCalledWith(filters);
    expect(cache.search).toHaveBeenCalledWith(filters, expect.any(Function));
  });

  it('rejects an inverted price range', () => {
    expect(() =>
      service.search({ ...filters, maxPrice: 100, minPrice: 200 }),
    ).toThrow(BadRequestException);
  });

  it('returns an active vehicle by id', async () => {
    findActiveById.mockResolvedValue(vehicle);

    await expect(service.findActiveById(vehicle.id)).resolves.toEqual(vehicle);
    expect(cache.detail).toHaveBeenCalledWith(vehicle.id, expect.any(Function));
  });

  it('throws when the vehicle does not exist or is not active', async () => {
    findActiveById.mockResolvedValue(null);

    await expect(service.findActiveById(vehicle.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a temporary content URL only for an active uploaded image', async () => {
    const image = {
      altText: 'Tesla Model Y',
      id: '22222222-2222-4222-8222-222222222222',
      isCover: true,
      sortOrder: 0,
      storageKey: 'vehicle-images/user/vehicle/photo.webp',
    };
    jest.mocked(repository.findActiveImage).mockResolvedValue(image);
    jest
      .mocked(storage.createViewUrl)
      .mockResolvedValue('https://storage.example/view');

    await expect(service.imageContentUrl(image.id)).resolves.toBe(
      'https://storage.example/view',
    );
  });
});
