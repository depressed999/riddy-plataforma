import type { RedisService } from './redis.service';
import { RedisThrottlerStorage } from './redis-throttler.storage';

describe('RedisThrottlerStorage', () => {
  it('maps the atomic Redis result to the Nest throttler record', async () => {
    const redis = {
      client: { eval: jest.fn().mockResolvedValue([4, 900, 1, 500]) },
      key: jest.fn((...parts: string[]) => parts.join(':')),
    } as unknown as RedisService;
    const storage = new RedisThrottlerStorage(redis);

    await expect(
      storage.increment('client', 1_000, 3, 500, 'default'),
    ).resolves.toEqual({
      isBlocked: true,
      timeToBlockExpire: 500,
      timeToExpire: 900,
      totalHits: 4,
    });
    expect(redis.key).toHaveBeenCalledWith('throttle', 'default', 'client');
  });
});
