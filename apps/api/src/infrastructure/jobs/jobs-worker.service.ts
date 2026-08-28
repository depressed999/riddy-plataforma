import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Job, Worker } from 'bullmq';

import { redisOptionsFromUrl } from '../redis/redis-options';
import { JobsRepository } from './jobs.repository';
import {
  jobNames,
  jobsQueueName,
  type PasswordRecoveryJobData,
} from './jobs.types';

@Injectable()
export class JobsWorkerService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(JobsWorkerService.name);
  private readonly enabled: boolean;
  private readonly redisUrl: string;
  private readonly redisPrefix: string;
  private readonly webhookSecret: string | undefined;
  private readonly webhookUrl: string | undefined;
  private worker: Worker | null = null;

  constructor(
    @Inject(ConfigService) configService: ConfigService,
    @Inject(JobsRepository) private readonly repository: JobsRepository,
  ) {
    this.enabled =
      configService.get<string>('JOBS_WORKER_ENABLED', 'true') === 'true';
    this.redisUrl = configService.get<string>(
      'REDIS_URL',
      'redis://:riddy-development-redis-secret@localhost:6379/0',
    );
    this.redisPrefix = configService.get<string>('REDIS_KEY_PREFIX', 'riddy');
    this.webhookSecret = configService.get<string>('AUTH_RESET_WEBHOOK_SECRET');
    this.webhookUrl = configService.get<string>('AUTH_RESET_WEBHOOK_URL');
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.log('Embedded jobs worker disabled.');
      return;
    }
    this.worker = new Worker(jobsQueueName, (job) => this.process(job), {
      concurrency: 5,
      connection: redisOptionsFromUrl(this.redisUrl, null),
      prefix: `${this.redisPrefix}:bull`,
    });
    this.worker.on('failed', (job, error) =>
      this.logger.error(
        `Job ${job?.name ?? 'unknown'} failed: ${error.message}`,
      ),
    );
    await this.worker.waitUntilReady();
    this.logger.log('BullMQ worker ready.');
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.worker) await this.worker.close();
  }

  private async process(job: Job): Promise<unknown> {
    if (job.name === jobNames.passwordRecovery) {
      return this.deliverPasswordRecovery(job.data as PasswordRecoveryJobData);
    }
    if (job.name === jobNames.authCleanup) {
      return this.repository.cleanupExpiredAuthenticationData();
    }
    throw new Error(`Unsupported job: ${job.name}`);
  }

  private async deliverPasswordRecovery(
    data: PasswordRecoveryJobData,
  ): Promise<{ delivered: true }> {
    if (!this.webhookUrl) {
      throw new Error('AUTH_RESET_WEBHOOK_URL is not configured.');
    }
    const response = await fetch(this.webhookUrl, {
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json',
        ...(this.webhookSecret
          ? { authorization: `Bearer ${this.webhookSecret}` }
          : {}),
      },
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Recovery webhook returned ${response.status}.`);
    }
    return { delivered: true };
  }
}
