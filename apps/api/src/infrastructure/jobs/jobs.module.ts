import { Module } from '@nestjs/common';

import { JobsQueueService } from './jobs-queue.service';

@Module({
  exports: [JobsQueueService],
  providers: [JobsQueueService],
})
export class JobsModule {}
