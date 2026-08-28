import { NotFoundException } from '@nestjs/common';

import type { ProfileRepository } from './profile.repository';
import { ProfileService } from './profile.service';
import type { UserProfile } from './profile.types';

const profile: UserProfile = {
  avatarUrl: null,
  bio: null,
  city: null,
  createdAt: '2026-08-25T00:00:00.000Z',
  email: 'nycolas@example.com',
  emailVerified: false,
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Nycolas Silva',
  phone: null,
  state: null,
  updatedAt: '2026-08-25T00:00:00.000Z',
};

describe('ProfileService', () => {
  let repository: jest.Mocked<ProfileRepository>;
  let service: ProfileService;

  beforeEach(() => {
    repository = {
      findByUserId: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<ProfileRepository>;
    service = new ProfileService(repository);
  });

  it('returns the authenticated user profile', async () => {
    repository.findByUserId.mockResolvedValue(profile);

    await expect(service.getProfile(profile.id)).resolves.toEqual(profile);
  });

  it('normalizes optional fields before updating', async () => {
    repository.update.mockResolvedValue({
      ...profile,
      bio: 'Gosto de viagens tranquilas.',
      city: 'Manaus',
      phone: '+5592999999999',
      state: 'AM',
    });

    await service.updateProfile(profile.id, {
      bio: ' Gosto de viagens tranquilas. ',
      city: ' Manaus ',
      name: ' Nycolas Silva ',
      phone: '+55 (92) 99999-9999',
      state: 'am',
    });

    expect(repository.update).toHaveBeenCalledWith(profile.id, {
      bio: 'Gosto de viagens tranquilas.',
      city: 'Manaus',
      name: 'Nycolas Silva',
      phone: '+5592999999999',
      state: 'AM',
    });
  });

  it('clears optional fields sent as blank values', async () => {
    repository.update.mockResolvedValue(profile);

    await service.updateProfile(profile.id, {
      bio: ' ',
      city: '',
      phone: '',
      state: '',
    });

    expect(repository.update).toHaveBeenCalledWith(profile.id, {
      bio: null,
      city: null,
      phone: null,
      state: null,
    });
  });

  it('rejects a missing profile', async () => {
    repository.findByUserId.mockResolvedValue(null);

    await expect(service.getProfile(profile.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
