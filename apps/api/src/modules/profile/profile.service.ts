import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ProfileRepository } from './profile.repository';
import type { ProfileChanges, UserProfile } from './profile.types';

@Injectable()
export class ProfileService {
  constructor(
    @Inject(ProfileRepository)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async getProfile(userId: string): Promise<UserProfile> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    return profile;
  }

  async updateProfile(
    userId: string,
    input: {
      bio?: string;
      city?: string;
      name?: string;
      phone?: string;
      state?: string;
    },
  ): Promise<UserProfile> {
    const changes: ProfileChanges = {};

    if (input.name !== undefined) {
      changes.name = input.name.trim();
    }

    if (input.phone !== undefined) {
      changes.phone = normalizeOptionalPhone(input.phone);
    }

    if (input.city !== undefined) {
      changes.city = normalizeOptionalText(input.city);
    }

    if (input.state !== undefined) {
      changes.state = normalizeOptionalText(input.state)?.toUpperCase() ?? null;
    }

    if (input.bio !== undefined) {
      changes.bio = normalizeOptionalText(input.bio);
    }

    if (Object.keys(changes).length === 0) {
      return this.getProfile(userId);
    }

    const profile = await this.profileRepository.update(userId, changes);

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    return profile;
  }
}

function normalizeOptionalText(value: string): string | null {
  return value.trim() || null;
}

function normalizeOptionalPhone(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const prefix = trimmed.startsWith('+') ? '+' : '';
  return `${prefix}${trimmed.replace(/\D/g, '')}`;
}
