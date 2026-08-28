import { Module } from '@nestjs/common';

import { JobsRepository } from './jobs.repository';
import { JobsWorkerService } from './jobs-worker.service';

@Module({ providers: [JobsRepository, JobsWorkerService] })
export class JobsWorkerModule {}
