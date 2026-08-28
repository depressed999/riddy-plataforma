import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationShutdown,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { redisOptionsFromUrl } from './redis-options';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  readonly client: Redis;
  readonly keyPrefix: string;
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(ConfigService) configService: ConfigService) {
    const redisUrl = configService.get<string>(
      'REDIS_URL',
      'redis://:riddy-development-redis-secret@localhost:6379/0',
    );
    this.keyPrefix = configService.get<string>('REDIS_KEY_PREFIX', 'riddy');
    this.client = new Redis({
      ...redisOptionsFromUrl(redisUrl, 1),
      lazyConnect: true,
    });
    this.client.on('error', (error) =>
      this.logger.error(`Redis connection error: ${error.message}`),
    );
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    await this.client.ping();
    this.logger.log('Redis connection established.');
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client.status !== 'end') {
      await this.client.quit().catch(() => this.client.disconnect());
    }
  }

  key(...parts: string[]): string {
    return [this.keyPrefix, ...parts].join(':');
  }

  async ping(): Promise<boolean> {
    return (await this.client.ping()) === 'PONG';
  }
}
