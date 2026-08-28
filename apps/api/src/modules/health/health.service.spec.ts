import type { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';

import type { DatabaseService } from '../../database/database.service';
import type { RedisService } from '../../infrastructure/redis/redis.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns an operational status when Redis responds', async () => {
    const redis = {
      ping: jest.fn().mockResolvedValue(true),
    } as unknown as RedisService;
    const database = {
      ping: jest.fn().mockResolvedValue(true),
    } as unknown as DatabaseService;
    const config = {
      get: jest.fn((_key: string, fallback: string) => fallback),
    } as unknown as ConfigService;
    const service = new HealthService(database, redis, config);
    const result = await service.getStatus();

    expect(result.dependencies.postgres.status).toBe('ok');
    expect(result.dependencies.redis.status).toBe('ok');
    expect(result.service).toBe('riddy-api');
    expect(result.status).toBe('ok');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });

  it('reports liveness without checking external dependencies', () => {
    const database = { ping: jest.fn() } as unknown as DatabaseService;
    const redis = { ping: jest.fn() } as unknown as RedisService;
    const config = {
      get: jest.fn().mockReturnValue('test-version'),
    } as unknown as ConfigService;
    const service = new HealthService(database, redis, config);

    expect(service.getLiveness()).toEqual(
      expect.objectContaining({ status: 'ok', version: 'test-version' }),
    );
    expect(database.ping).not.toHaveBeenCalled();
    expect(redis.ping).not.toHaveBeenCalled();
  });

  it('returns service unavailable when a readiness dependency fails', async () => {
    const database = {
      ping: jest.fn().mockRejectedValue(new Error('offline')),
    } as unknown as DatabaseService;
    const redis = {
      ping: jest.fn().mockResolvedValue(true),
    } as unknown as RedisService;
    const config = {
      get: jest.fn((_key: string, fallback: string) => fallback),
    } as unknown as ConfigService;
    const service = new HealthService(database, redis, config);

    await expect(service.getStatus()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
