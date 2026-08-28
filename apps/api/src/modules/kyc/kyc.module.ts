import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { KycController } from './kyc.controller';
import { KycRepository } from './kyc.repository';
import { KycService } from './kyc.service';
import { PrivateStorageService } from './private-storage.service';

@Module({
  controllers: [KycController],
  imports: [AuthModule],
  providers: [KycRepository, KycService, PrivateStorageService],
})
export class KycModule {}
