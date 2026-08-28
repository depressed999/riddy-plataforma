import { Module } from '@nestjs/common';

import { JobsModule } from '../../infrastructure/jobs/jobs.module';

import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';
import { TrustedOriginGuard } from './trusted-origin.guard';

@Module({
  controllers: [AuthController],
  imports: [JobsModule],
  exports: [AuthService, SessionAuthGuard, TrustedOriginGuard],
  providers: [
    AuthRepository,
    AuthService,
    SessionAuthGuard,
    TrustedOriginGuard,
  ],
})
export class AuthModule {}
