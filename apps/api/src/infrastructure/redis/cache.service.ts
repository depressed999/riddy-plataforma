import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { RedisService } from './redis.service';

@Injectable()
export class CacheService {
  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  async remember<T>(
    namespace: string,
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cacheKey = this.redis.key('cache', namespace, key);
    const cached = await this.redis.client.get(cacheKey);
    if (cached) return JSON.parse(cached) as T;

    const lockKey = `${cacheKey}:lock`;
    const lockToken = randomUUID();
    const locked = await this.redis.client.set(
      lockKey,
      lockToken,
      'PX',
      5_000,
      'NX',
    );

    if (!locked) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const retried = await this.redis.client.get(cacheKey);
      if (retried) return JSON.parse(retried) as T;
      return loader();
    }

    try {
      const value = await loader();
      const tagKey = this.redis.key('cache-tag', namespace);
      await this.redis.client
        .multi()
        .set(cacheKey, JSON.stringify(value), 'EX', ttlSeconds)
        .sadd(tagKey, cacheKey)
        .expire(tagKey, ttlSeconds + 60)
        .exec();
      return value;
    } finally {
      await this.redis.client.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1,
        lockKey,
        lockToken,
      );
    }
  }

  async invalidate(namespace: string): Promise<void> {
    const tagKey = this.redis.key('cache-tag', namespace);
    const keys = await this.redis.client.smembers(tagKey);
    if (keys.length) await this.redis.client.del(...keys);
    await this.redis.client.del(tagKey);
  }
}
