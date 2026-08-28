import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import type { HostsRepository } from './hosts.repository';
import { HostsService } from './hosts.service';
import type { HostProfile, HostVehicle } from './hosts.types';

const userId = '11111111-1111-4111-8111-111111111111';
const vehicleId = '22222222-2222-4222-8222-222222222222';

describe('HostsService', () => {
  let repository: jest.Mocked<HostsRepository>;
  let service: HostsService;

  beforeEach(() => {
    repository = {
      createAvailabilityBlock: jest.fn(),
      createVehicle: jest.fn(),
      deleteAvailabilityBlock: jest.fn(),
      findProfile: jest.fn(),
      findVehicle: jest.fn(),
      getDashboard: jest.fn(),
      getFinance: jest.fn(),
      getKycStatus: jest.fn(),
      hasAvailabilityConflict: jest.fn(),
      listAvailabilityBlocks: jest.fn(),
      listBookings: jest.fn(),
      listVehicles: jest.fn(),
      setProfileStatus: jest.fn(),
      updateProfile: jest.fn(),
      updateVehicle: jest.fn(),
      updateVehicleStatus: jest.fn(),
      upsertProfile: jest.fn(),
    } as unknown as jest.Mocked<HostsRepository>;
    service = new HostsService(repository);
    repository.findProfile.mockResolvedValue(profileFixture());
    repository.findVehicle.mockResolvedValue(vehicleFixture());
    repository.getKycStatus.mockResolvedValue('approved');
  });

  it('requires acceptance of the host terms', async () => {
    await expect(
      service.onboard(userId, {
        acceptTerms: false,
        displayName: 'Riddy Manaus',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.upsertProfile).not.toHaveBeenCalled();
  });

  it('creates an active profile only when KYC is approved', async () => {
    repository.getKycStatus.mockResolvedValue('pending_review');
    repository.upsertProfile.mockResolvedValue(
      profileFixture({ status: 'onboarding' }),
    );

    await service.onboard(userId, {
      acceptTerms: true,
      displayName: '  Riddy Manaus  ',
      supportPhone: '(92) 99999-0000',
    });

    expect(repository.upsertProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Riddy Manaus',
        status: 'onboarding',
        supportPhone: '92999990000',
      }),
    );
  });

  it('promotes an onboarding profile after KYC approval', async () => {
    repository.getDashboard.mockResolvedValue({
      kycStatus: 'approved',
      metrics: {
        activeVehicles: 0,
        approvedGross: 0,
        confirmedBookings: 0,
        currency: 'BRL',
        pendingBookings: 0,
        totalVehicles: 0,
      },
      profile: profileFixture({ status: 'onboarding' }),
    });
    repository.setProfileStatus.mockResolvedValue(profileFixture());

    await expect(service.getDashboard(userId)).resolves.toMatchObject({
      profile: { status: 'active' },
    });
    expect(repository.setProfileStatus).toHaveBeenCalledWith(userId, 'active');
  });

  it('creates vehicles as normalized drafts', async () => {
    repository.createVehicle.mockResolvedValue(vehicleFixture());

    await service.createVehicle(userId, {
      amenities: [' Ar-condicionado ', 'Ar-condicionado', ''],
      city: ' Manaus ',
      dailyRate: 280,
      description: ' SUV confortável ',
      fuelType: ' Flex ',
      latitude: -3.119,
      longitude: -60.0217,
      make: ' Jeep ',
      model: ' Compass ',
      seats: 5,
      state: 'am',
      transmission: ' Automático ',
      type: 'car',
      year: 2024,
    });

    expect(repository.createVehicle).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        amenities: ['Ar-condicionado'],
        city: 'Manaus',
        make: 'Jeep',
        state: 'AM',
      }),
    );
  });

  it('does not publish vehicles before host activation and KYC approval', async () => {
    repository.findProfile.mockResolvedValue(
      profileFixture({ status: 'onboarding' }),
    );
    repository.getKycStatus.mockResolvedValue('pending_review');

    await expect(
      service.updateVehicleStatus(userId, vehicleId, { status: 'active' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.updateVehicleStatus).not.toHaveBeenCalled();
  });

  it('rejects access to a vehicle owned by another account', async () => {
    repository.findVehicle.mockResolvedValue(null);

    await expect(
      service.updateVehicleStatus(userId, vehicleId, { status: 'inactive' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('blocks dates only when the vehicle is free', async () => {
    repository.hasAvailabilityConflict.mockResolvedValue(true);

    await expect(
      service.createAvailabilityBlock(userId, {
        endDate: futureDate(6),
        startDate: futureDate(3),
        vehicleId,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps concurrent calendar exclusion violations to conflict', async () => {
    repository.hasAvailabilityConflict.mockResolvedValue(false);
    repository.createAvailabilityBlock.mockRejectedValue({ code: '23P01' });

    await expect(
      service.createAvailabilityBlock(userId, {
        endDate: futureDate(6),
        startDate: futureDate(3),
        vehicleId,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

function futureDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function profileFixture(overrides: Partial<HostProfile> = {}): HostProfile {
  return {
    bio: null,
    createdAt: new Date().toISOString(),
    displayName: 'Riddy Manaus',
    id: '33333333-3333-4333-8333-333333333333',
    status: 'active',
    supportPhone: null,
    termsAcceptedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId,
    ...overrides,
  };
}

function vehicleFixture(overrides: Partial<HostVehicle> = {}): HostVehicle {
  return {
    amenities: [],
    createdAt: new Date().toISOString(),
    dailyRate: 280,
    description: 'SUV confortável para viagens em família.',
    fuelType: 'Flex',
    id: vehicleId,
    images: [],
    location: {
      city: 'Manaus',
      latitude: -3.119,
      longitude: -60.0217,
      state: 'AM',
    },
    make: 'Jeep',
    model: 'Compass',
    ownerId: userId,
    seats: 5,
    status: 'draft',
    transmission: 'Automático',
    type: 'car',
    updatedAt: new Date().toISOString(),
    year: 2024,
    ...overrides,
  };
}
