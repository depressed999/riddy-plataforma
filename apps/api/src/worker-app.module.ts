import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateWorkerEnvironment } from './config/environment-validation';
import { DatabaseModule } from './database/database.module';
import { JobsWorkerModule } from './infrastructure/jobs/jobs-worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['../../.env.local', '../../.env', '.env.local', '.env'],
      isGlobal: true,
      validate: validateWorkerEnvironment,
    }),
    DatabaseModule,
    JobsWorkerModule,
  ],
})
export class WorkerAppModule {}
