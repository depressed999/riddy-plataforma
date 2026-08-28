import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import type { BookingsRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';
import type { Booking } from './bookings.types';

const vehicleId = '11111111-1111-4111-8111-111111111111';
const renterId = '22222222-2222-4222-8222-222222222222';
const ownerId = '33333333-3333-4333-8333-333333333333';

describe('BookingsService', () => {
  let repository: jest.Mocked<BookingsRepository>;
  let service: BookingsService;

  beforeEach(() => {
    repository = {
      cancel: jest.fn(),
      create: jest.fn(),
      findActiveVehicle: jest.fn(),
      findActivePaymentStatus: jest.fn(),
      findByIdForRenter: jest.fn(),
      hasConflict: jest.fn(),
      listByRenter: jest.fn(),
    } as unknown as jest.Mocked<BookingsRepository>;
    service = new BookingsService(repository);
    repository.findActiveVehicle.mockResolvedValue({
      dailyRate: 350,
      id: vehicleId,
      ownerId,
    });
    repository.hasConflict.mockResolvedValue(false);
    repository.findActivePaymentStatus.mockResolvedValue(null);
  });

  it('calculates price and availability on the server', async () => {
    const pickupDate = futureDate(10);
    const returnDate = futureDate(13);

    await expect(
      service.quote({ pickupDate, returnDate, vehicleId }),
    ).resolves.toEqual({
      available: true,
      currency: 'BRL',
      dailyRate: 350,
      pickupDate,
      returnDate,
      totalDays: 3,
      totalPrice: 1050,
      vehicleId,
    });
  });

  it('reports an overlapping period as unavailable', async () => {
    repository.hasConflict.mockResolvedValue(true);

    await expect(
      service.quote({
        pickupDate: futureDate(10),
        returnDate: futureDate(11),
        vehicleId,
      }),
    ).resolves.toMatchObject({ available: false });
  });

  it('rejects invalid dates and inactive vehicles', async () => {
    await expect(
      service.quote({
        pickupDate: futureDate(2),
        returnDate: futureDate(2),
        vehicleId,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    repository.findActiveVehicle.mockResolvedValue(null);
    await expect(
      service.quote({
        pickupDate: futureDate(2),
        returnDate: futureDate(3),
        vehicleId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a pending booking from the authoritative quote', async () => {
    const pickupDate = futureDate(10);
    const returnDate = futureDate(12);
    const booking = bookingFixture({ pickupDate, returnDate });
    repository.create.mockResolvedValue(booking);

    await expect(
      service.create({ pickupDate, returnDate, vehicleId }, renterId),
    ).resolves.toEqual(booking);
    expect(repository.create).toHaveBeenCalledWith({
      dailyRate: 350,
      pickupDate,
      renterId,
      returnDate,
      totalDays: 2,
      totalPrice: 700,
      vehicleId,
    });
  });

  it('blocks unavailable periods and self-booking', async () => {
    repository.hasConflict.mockResolvedValue(true);
    await expect(
      service.create(
        {
          pickupDate: futureDate(10),
          returnDate: futureDate(11),
          vehicleId,
        },
        renterId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    repository.hasConflict.mockResolvedValue(false);
    repository.findActiveVehicle.mockResolvedValue({
      dailyRate: 350,
      id: vehicleId,
      ownerId: renterId,
    });
    await expect(
      service.create(
        {
          pickupDate: futureDate(10),
          returnDate: futureDate(11),
          vehicleId,
        },
        renterId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('maps a concurrent database overlap to conflict', async () => {
    repository.create.mockRejectedValue({ code: '23P01' });

    await expect(
      service.create(
        {
          pickupDate: futureDate(10),
          returnDate: futureDate(11),
          vehicleId,
        },
        renterId,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('cancels a future active booking and rejects a cancelled one', async () => {
    const booking = bookingFixture({ status: 'pending' });
    repository.findByIdForRenter.mockResolvedValue(booking);
    repository.cancel.mockResolvedValue({ ...booking, status: 'cancelled' });

    await expect(service.cancel(booking.id, renterId)).resolves.toMatchObject({
      status: 'cancelled',
    });

    repository.findByIdForRenter.mockResolvedValue({
      ...booking,
      status: 'cancelled',
    });
    await expect(service.cancel(booking.id, renterId)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

function futureDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function bookingFixture(overrides: Partial<Booking> = {}): Booking {
  return {
    cancelledAt: null,
    createdAt: new Date().toISOString(),
    currency: 'BRL',
    dailyRate: 350,
    id: '44444444-4444-4444-8444-444444444444',
    pickupDate: futureDate(10),
    renterId,
    returnDate: futureDate(12),
    status: 'pending',
    totalDays: 2,
    totalPrice: 700,
    updatedAt: new Date().toISOString(),
    vehicle: {
      city: 'Manaus',
      id: vehicleId,
      imageUrl: '/vehicles/tesla-model-y.jpg',
      make: 'Tesla',
      model: 'Model Y',
      state: 'AM',
      year: 2023,
    },
    ...overrides,
  };
}
