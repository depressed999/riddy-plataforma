interface RiddyRedisOptions {
  db: number;
  enableReadyCheck: boolean;
  host: string;
  maxRetriesPerRequest: number | null;
  password?: string;
  port: number;
  tls?: Record<string, never>;
  username?: string;
}

export function redisOptionsFromUrl(
  redisUrl: string,
  maxRetriesPerRequest: number | null,
): RiddyRedisOptions {
  const parsed = new URL(redisUrl);
  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use redis:// or rediss://.');
  }

  const database = parsed.pathname.replace(/^\//, '');
  return {
    db: database ? Number(database) : 0,
    enableReadyCheck: true,
    host: parsed.hostname,
    maxRetriesPerRequest,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    port: parsed.port ? Number(parsed.port) : 6379,
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
    username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
  };
}
