import { Inject, Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';

import { RedisService } from './redis.service';

const incrementScript = `
local time = redis.call('TIME')
local now = time[1] * 1000 + math.floor(time[2] / 1000)
local total = tonumber(redis.call('HGET', KEYS[1], 'total')) or 0
local expiresAt = tonumber(redis.call('HGET', KEYS[1], 'expiresAt')) or 0
local blockedUntil = tonumber(redis.call('HGET', KEYS[1], 'blockedUntil')) or 0

if blockedUntil > now then
  return {total, math.max(expiresAt - now, 0), 1, blockedUntil - now}
end

if expiresAt <= now then
  total = 0
  expiresAt = now + tonumber(ARGV[1])
  blockedUntil = 0
end

total = total + 1
if total > tonumber(ARGV[2]) then
  blockedUntil = now + tonumber(ARGV[3])
end

redis.call('HSET', KEYS[1], 'total', total, 'expiresAt', expiresAt, 'blockedUntil', blockedUntil)
redis.call('PEXPIRE', KEYS[1], math.max(expiresAt, blockedUntil) - now)
return {total, math.max(expiresAt - now, 0), blockedUntil > now and 1 or 0, math.max(blockedUntil - now, 0)}
`;

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject(RedisService) private readonly redis: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{
    isBlocked: boolean;
    timeToBlockExpire: number;
    timeToExpire: number;
    totalHits: number;
  }> {
    const blockMs = blockDuration > 0 ? blockDuration : ttl;
    const result = (await this.redis.client.eval(
      incrementScript,
      1,
      this.redis.key('throttle', throttlerName, key),
      ttl,
      limit,
      blockMs,
    )) as [number, number, number, number];

    return {
      isBlocked: result[2] === 1,
      timeToBlockExpire: result[3],
      timeToExpire: result[1],
      totalHits: result[0],
    };
  }
}
