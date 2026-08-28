import { redisOptionsFromUrl } from './redis-options';

describe('redisOptionsFromUrl', () => {
  it('parses authentication, port and database from a Redis URL', () => {
    expect(
      redisOptionsFromUrl('redis://worker:secret@redis.local:6380/4', 2),
    ).toEqual(
      expect.objectContaining({
        db: 4,
        host: 'redis.local',
        maxRetriesPerRequest: 2,
        password: 'secret',
        port: 6380,
        username: 'worker',
      }),
    );
  });

  it('enables TLS for rediss and rejects unsupported protocols', () => {
    expect(redisOptionsFromUrl('rediss://redis.local', null).tls).toEqual({});
    expect(() => redisOptionsFromUrl('http://redis.local', 1)).toThrow(
      'REDIS_URL must use redis:// or rediss://.',
    );
  });
});
