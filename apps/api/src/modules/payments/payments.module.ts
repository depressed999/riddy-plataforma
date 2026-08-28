import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { MercadoPagoGateway } from './mercado-pago.gateway';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

@Module({
  controllers: [PaymentsController],
  imports: [AuthModule],
  providers: [MercadoPagoGateway, PaymentsRepository, PaymentsService],
})
export class PaymentsModule {}
