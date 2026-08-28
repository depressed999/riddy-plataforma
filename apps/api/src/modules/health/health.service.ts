import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DatabaseService } from '../../database/database.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

import type {
  HealthDependency,
  HealthStatus,
  LivenessStatus,
} from './health.types';

@Injectable()
export class HealthService {
  private readonly version: string;

  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    this.version = configService.get<string>('APP_VERSION', 'development');
  }

  getLiveness(): LivenessStatus {
    return this.baseStatus();
  }

  async getStatus(): Promise<HealthStatus> {
    const [postgres, redis] = await Promise.all([
      this.measure(() => this.database.ping()),
      this.measure(() => this.redis.ping()),
    ]);
    const status: HealthStatus = {
      ...this.baseStatus(),
      dependencies: { postgres, redis },
      status:
        postgres.status === 'ok' && redis.status === 'ok' ? 'ok' : 'degraded',
    };
    if (status.status === 'degraded') {
      throw new ServiceUnavailableException(status);
    }
    return status;
  }

  private baseStatus(): LivenessStatus {
    return {
      service: 'riddy-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: this.version,
    };
  }

  private async measure(
    check: () => Promise<boolean>,
  ): Promise<HealthDependency> {
    const startedAt = performance.now();
    try {
      const healthy = await check();
      return {
        latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
        status: healthy ? 'ok' : 'error',
      };
    } catch {
      return {
        latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
        status: 'error',
      };
    }
  }
}
