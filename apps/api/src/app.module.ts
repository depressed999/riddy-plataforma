import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { validateEnvironment } from './config/environment-validation';
import { DatabaseModule } from './database/database.module';
import { JobsModule } from './infrastructure/jobs/jobs.module';
import { JobsWorkerModule } from './infrastructure/jobs/jobs-worker.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { RedisThrottlerStorage } from './infrastructure/redis/redis-throttler.storage';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { HealthModule } from './modules/health/health.module';
import { HostsModule } from './modules/hosts/hosts.module';
import { KycModule } from './modules/kyc/kyc.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProfileModule } from './modules/profile/profile.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['../../.env.local', '../../.env', '.env.local', '.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    RedisModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisThrottlerStorage, ConfigService],
      useFactory: (
        storage: RedisThrottlerStorage,
        configService: ConfigService,
      ) => ({
        storage,
        throttlers: [
          {
            blockDuration: positiveNumber(
              configService.get<string>('THROTTLE_BLOCK_DURATION_MS'),
              60_000,
            ),
            limit: positiveNumber(
              configService.get<string>('THROTTLE_LIMIT'),
              120,
            ),
            ttl: positiveNumber(
              configService.get<string>('THROTTLE_TTL_MS'),
              60_000,
            ),
          },
        ],
      }),
    }),
    AdminModule,
    AuthModule,
    BookingsModule,
    DatabaseModule,
    HealthModule,
    HostsModule,
    JobsModule,
    JobsWorkerModule,
    KycModule,
    MessagesModule,
    PaymentsModule,
    ProfileModule,
    VehiclesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
