import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { KycModule } from '../kyc/kyc.module';
import { HostsController } from './hosts.controller';
import { HostsRepository } from './hosts.repository';
import { HostsService } from './hosts.service';

@Module({
  controllers: [HostsController],
  imports: [AuthModule, KycModule],
  providers: [HostsRepository, HostsService],
})
export class HostsModule {}
