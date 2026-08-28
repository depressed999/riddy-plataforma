import { Inject, Injectable } from '@nestjs/common';
import { and, isNotNull, lt, or } from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service';
import { authSessions, passwordResetTokens } from '../../database/schema';
import type { AuthCleanupJobResult } from './jobs.types';

@Injectable()
export class JobsRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async cleanupExpiredAuthenticationData(): Promise<AuthCleanupJobResult> {
    const now = new Date();
    const usedBefore = new Date(now.getTime() - 7 * 86_400_000);
    return this.database.database.transaction(async (transaction) => {
      const sessions = await transaction
        .delete(authSessions)
        .where(lt(authSessions.expiresAt, now))
        .returning({ id: authSessions.id });
      const resetTokens = await transaction
        .delete(passwordResetTokens)
        .where(
          or(
            lt(passwordResetTokens.expiresAt, now),
            and(
              isNotNull(passwordResetTokens.usedAt),
              lt(passwordResetTokens.usedAt, usedBefore),
            ),
          ),
        )
        .returning({ id: passwordResetTokens.id });
      return {
        expiredResetTokens: resetTokens.length,
        expiredSessions: sessions.length,
      };
    });
  }
}
