import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service';
import {
  authSessions,
  oauthAccounts,
  passwordResetTokens,
  users,
  type UserSelect,
} from '../../database/schema';
import type { GoogleProfile, PublicUser } from './auth.types';

type StoredSession = {
  expiresAt: Date;
  id: string;
  user: PublicUser;
};

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async findUserByEmail(email: string): Promise<UserSelect | null> {
    const [user] = await this.databaseService.database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  async createUser(input: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<PublicUser> {
    const [user] = await this.databaseService.database
      .insert(users)
      .values(input)
      .returning();

    if (!user) {
      throw new Error('User insert returned no row.');
    }

    return this.toPublicUser(user);
  }

  async createSession(input: {
    expiresAt: Date;
    tokenHash: string;
    userId: string;
  }): Promise<void> {
    await this.databaseService.database.insert(authSessions).values(input);
  }

  async findSession(tokenHash: string): Promise<StoredSession | null> {
    const [row] = await this.databaseService.database
      .select({
        avatarUrl: users.avatarUrl,
        email: users.email,
        emailVerified: users.emailVerified,
        expiresAt: authSessions.expiresAt,
        id: authSessions.id,
        name: users.name,
        role: users.role,
        userId: users.id,
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(
        and(
          eq(authSessions.tokenHash, tokenHash),
          gt(authSessions.expiresAt, new Date()),
          eq(users.status, 'active'),
        ),
      )
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      expiresAt: row.expiresAt,
      id: row.id,
      user: {
        avatarUrl: row.avatarUrl,
        email: row.email,
        emailVerified: row.emailVerified,
        id: row.userId,
        name: row.name,
        role: row.role,
      },
    };
  }

  async touchSession(id: string): Promise<void> {
    await this.databaseService.database
      .update(authSessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(authSessions.id, id));
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.databaseService.database
      .delete(authSessions)
      .where(eq(authSessions.tokenHash, tokenHash));
  }

  async isUserActive(userId: string): Promise<boolean> {
    const [row] = await this.databaseService.database
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.status, 'active')))
      .limit(1);

    return Boolean(row);
  }

  async replacePasswordResetToken(input: {
    expiresAt: Date;
    tokenHash: string;
    userId: string;
  }): Promise<void> {
    await this.databaseService.database.transaction(async (transaction) => {
      await transaction
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, input.userId));
      await transaction.insert(passwordResetTokens).values(input);
    });
  }

  async resetPassword(input: {
    passwordHash: string;
    tokenHash: string;
  }): Promise<boolean> {
    return this.databaseService.database.transaction(async (transaction) => {
      const [resetToken] = await transaction
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, input.tokenHash),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!resetToken) {
        return false;
      }

      const now = new Date();
      await transaction
        .update(users)
        .set({
          emailVerified: true,
          passwordHash: input.passwordHash,
          updatedAt: now,
        })
        .where(eq(users.id, resetToken.userId));
      await transaction
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, resetToken.id));
      await transaction
        .delete(authSessions)
        .where(eq(authSessions.userId, resetToken.userId));

      return true;
    });
  }

  async findOrCreateGoogleUser(profile: GoogleProfile): Promise<PublicUser> {
    const existingAccount = await this.findOAuthAccount('google', profile.id);

    if (existingAccount) {
      return existingAccount;
    }

    let user = await this.findUserByEmail(profile.email);

    if (!user) {
      const [createdUser] = await this.databaseService.database
        .insert(users)
        .values({
          avatarUrl: profile.picture,
          email: profile.email,
          emailVerified: true,
          name: profile.name,
        })
        .returning();

      if (!createdUser) {
        throw new Error('Google user insert returned no row.');
      }

      user = createdUser;
    } else {
      const [updatedUser] = await this.databaseService.database
        .update(users)
        .set({
          avatarUrl: user.avatarUrl ?? profile.picture,
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      user = updatedUser ?? user;
    }

    await this.databaseService.database
      .insert(oauthAccounts)
      .values({
        provider: 'google',
        providerAccountId: profile.id,
        userId: user.id,
      })
      .onConflictDoNothing();

    const linkedUser = await this.findOAuthAccount('google', profile.id);

    if (!linkedUser) {
      throw new Error('Google account could not be linked.');
    }

    return linkedUser;
  }

  private async findOAuthAccount(
    provider: string,
    providerAccountId: string,
  ): Promise<PublicUser | null> {
    const [row] = await this.databaseService.database
      .select({
        avatarUrl: users.avatarUrl,
        email: users.email,
        emailVerified: users.emailVerified,
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(oauthAccounts)
      .innerJoin(users, eq(oauthAccounts.userId, users.id))
      .where(
        and(
          eq(oauthAccounts.provider, provider),
          eq(oauthAccounts.providerAccountId, providerAccountId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  private toPublicUser(user: UserSelect): PublicUser {
    return {
      avatarUrl: user.avatarUrl,
      email: user.email,
      emailVerified: user.emailVerified,
      id: user.id,
      name: user.name,
      role: user.role,
    };
  }
}
