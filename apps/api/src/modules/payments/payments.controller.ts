import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { sessionCookieName } from '../auth/auth.constants';
import { CurrentUser } from '../auth/auth.decorators';
import type { PublicUser } from '../auth/auth.types';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { TrustedOriginGuard } from '../auth/trusted-origin.guard';
import {
  CreatePaymentDto,
  PaymentActionDto,
  PaymentContextResponseDto,
  PaymentResponseDto,
} from './payments.dto';
import { PaymentsService } from './payments.service';
import type { Payment, PaymentContext } from './payments.types';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(PaymentsService)
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('booking/:bookingId')
  @UseGuards(SessionAuthGuard)
  @ApiCookieAuth(sessionCookieName)
  @ApiOperation({ summary: 'Carrega o contexto de pagamento da reserva' })
  @ApiParam({ format: 'uuid', name: 'bookingId' })
  @ApiOkResponse({ type: PaymentContextResponseDto })
  getContext(
    @CurrentUser() user: PublicUser,
    @Param('bookingId', new ParseUUIDPipe({ version: '4' })) bookingId: string,
  ): Promise<PaymentContext> {
    return this.paymentsService.getContext(bookingId, user.id);
  }

  @Post()
  @UseGuards(SessionAuthGuard, TrustedOriginGuard)
  @ApiCookieAuth(sessionCookieName)
  @ApiOperation({ summary: 'Cria pagamento por cartão ou Pix' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiCreatedResponse({ type: PaymentResponseDto })
  create(
    @CurrentUser() user: PublicUser,
    @Body() input: CreatePaymentDto,
  ): Promise<Payment> {
    return this.paymentsService.create(input, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard, TrustedOriginGuard)
  @ApiCookieAuth(sessionCookieName)
  @ApiOperation({ summary: 'Cancela um pagamento ainda não aprovado' })
  @ApiBody({ type: PaymentActionDto })
  @ApiParam({ format: 'uuid', name: 'id' })
  @ApiOkResponse({ type: PaymentResponseDto })
  cancel(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: PaymentActionDto,
  ): Promise<Payment> {
    return this.paymentsService.cancel(id, input.idempotencyKey, user.id);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionAuthGuard, TrustedOriginGuard)
  @ApiCookieAuth(sessionCookieName)
  @ApiOperation({ summary: 'Reembolsa integralmente um pagamento aprovado' })
  @ApiBody({ type: PaymentActionDto })
  @ApiParam({ format: 'uuid', name: 'id' })
  @ApiOkResponse({ type: PaymentResponseDto })
  refund(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() input: PaymentActionDto,
  ): Promise<Payment> {
    return this.paymentsService.refund(id, input.idempotencyKey, user.id);
  }

  @Post('webhook/mercado-pago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recebe notificações assinadas do Mercado Pago' })
  async webhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-request-id') requestId = '',
    @Headers('x-signature') signature = '',
    @Query('data.id') dataId = '',
  ): Promise<{ received: true }> {
    const action = stringProperty(body, 'action');
    const notificationId = String(body.id ?? 'unknown');
    const bodyDataId = nestedDataId(body);

    await this.paymentsService.processWebhook({
      action,
      body,
      dataId: dataId || bodyDataId,
      notificationId,
      requestId,
      signature,
    });
    return { received: true };
  }
}

function stringProperty(
  object: Record<string, unknown>,
  property: string,
): string {
  const value = object[property];
  return typeof value === 'string' ? value : 'payment.updated';
}

function nestedDataId(object: Record<string, unknown>): string {
  const data = object.data;
  if (!data || typeof data !== 'object' || !('id' in data)) {
    return '';
  }
  return String(data.id);
}
