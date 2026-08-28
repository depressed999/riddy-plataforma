import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';

@Module({
  controllers: [BookingsController],
  imports: [AuthModule],
  providers: [BookingsRepository, BookingsService],
})
export class BookingsModule {}
