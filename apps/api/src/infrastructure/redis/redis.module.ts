import { Global, Module } from '@nestjs/common';

import { CacheService } from './cache.service';
import { RedisThrottlerStorage } from './redis-throttler.storage';
import { RedisService } from './redis.service';

@Global()
@Module({
  exports: [CacheService, RedisService, RedisThrottlerStorage],
  providers: [CacheService, RedisService, RedisThrottlerStorage],
})
export class RedisModule {}
