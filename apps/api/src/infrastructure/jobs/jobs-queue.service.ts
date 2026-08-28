import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { createHash } from 'node:crypto';

import { redisOptionsFromUrl } from '../redis/redis-options';
import {
  jobNames,
  jobsQueueName,
  type PasswordRecoveryJobData,
} from './jobs.types';

@Injectable()
export class JobsQueueService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(JobsQueueService.name);
  private readonly queue: Queue;
  private readonly schedulerEnabled: boolean;
  private readonly cleanupInterval: number;
  private readonly recoveryWebhookUrl: string | undefined;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    const redisUrl = configService.get<string>(
      'REDIS_URL',
      'redis://:riddy-development-redis-secret@localhost:6379/0',
    );
    const prefix = configService.get<string>('REDIS_KEY_PREFIX', 'riddy');
    this.queue = new Queue(jobsQueueName, {
      connection: redisOptionsFromUrl(redisUrl, 1),
      prefix: `${prefix}:bull`,
    });
    this.schedulerEnabled =
      configService.get<string>('JOBS_SCHEDULER_ENABLED', 'true') === 'true';
    this.cleanupInterval = positiveNumber(
      configService.get<string>('JOBS_AUTH_CLEANUP_INTERVAL_MS'),
      3_600_000,
    );
    this.recoveryWebhookUrl = configService.get<string>(
      'AUTH_RESET_WEBHOOK_URL',
    );
  }

  async onModuleInit(): Promise<void> {
    await this.queue.waitUntilReady();
    if (this.schedulerEnabled) {
      await this.queue.upsertJobScheduler(
        'auth-cleanup-scheduler',
        { every: this.cleanupInterval },
        {
          data: {},
          name: jobNames.authCleanup,
          opts: {
            attempts: 3,
            backoff: { delay: 5_000, type: 'exponential' },
            removeOnComplete: { age: 86_400, count: 100 },
            removeOnFail: { age: 604_800, count: 500 },
          },
        },
      );
      this.logger.log('Recurring authentication cleanup job scheduled.');
    }
  }

  async enqueuePasswordRecovery(
    data: PasswordRecoveryJobData,
  ): Promise<boolean> {
    if (!this.recoveryWebhookUrl) return false;
    const jobFingerprint = createHash('sha256')
      .update(data.resetUrl)
      .digest('hex');
    await this.queue.add(jobNames.passwordRecovery, data, {
      attempts: 5,
      backoff: { delay: 2_000, type: 'exponential' },
      jobId: `password-recovery-${jobFingerprint}`,
      removeOnComplete: { age: 3_600, count: 1_000 },
      removeOnFail: { age: 86_400, count: 5_000 },
    });
    return true;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.queue.close();
  }
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
