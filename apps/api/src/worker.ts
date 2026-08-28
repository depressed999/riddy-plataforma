import { NestFactory } from '@nestjs/core';

import { WorkerAppModule } from './worker-app.module';

async function bootstrap(): Promise<void> {
  process.env.JOBS_WORKER_ENABLED = 'true';
  const application = await NestFactory.createApplicationContext(
    WorkerAppModule,
    { logger: ['error', 'log', 'warn'] },
  );
  application.enableShutdownHooks();
}

void bootstrap();
