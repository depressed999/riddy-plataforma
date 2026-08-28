import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

import { CacheService } from '../../infrastructure/redis/cache.service';
import type {
  PaginatedVehicles,
  Vehicle,
  VehicleSearch,
} from './vehicles.types';

@Injectable()
export class VehiclesCacheService {
  private readonly ttlSeconds: number;

  constructor(
    @Inject(CacheService) private readonly cache: CacheService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    const configured = Number(
      configService.get<string>('CACHE_VEHICLES_TTL_SECONDS', '30'),
    );
    this.ttlSeconds =
      Number.isFinite(configured) && configured > 0 ? configured : 30;
  }

  search(
    filters: VehicleSearch,
    loader: () => Promise<PaginatedVehicles>,
  ): Promise<PaginatedVehicles> {
    const fingerprint = createHash('sha256')
      .update(JSON.stringify(filters))
      .digest('hex');
    return this.cache.remember(
      'vehicles',
      `search:${fingerprint}`,
      this.ttlSeconds,
      loader,
    );
  }

  detail(id: string, loader: () => Promise<Vehicle | null>) {
    return this.cache.remember(
      'vehicles',
      `detail:${id}`,
      this.ttlSeconds,
      loader,
    );
  }
}
