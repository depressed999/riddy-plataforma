import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service';
import { users, type UserSelect } from '../../database/schema';
import type { ProfileChanges, UserProfile } from './profile.types';

@Injectable()
export class ProfileRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const [user] = await this.databaseService.database
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ? this.toProfile(user) : null;
  }

  async update(
    userId: string,
    changes: ProfileChanges,
  ): Promise<UserProfile | null> {
    const [user] = await this.databaseService.database
      .update(users)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return user ? this.toProfile(user) : null;
  }

  private toProfile(user: UserSelect): UserProfile {
    return {
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      city: user.city,
      createdAt: user.createdAt.toISOString(),
      email: user.email,
      emailVerified: user.emailVerified,
      id: user.id,
      name: user.name,
      phone: user.phone,
      state: user.state,
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
