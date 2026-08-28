import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';

import {
  MercadoPagoGateway,
  PaymentGatewayError,
} from './mercado-pago.gateway';
import { PaymentsRepository } from './payments.repository';
import { validateMercadoPagoSignature } from './payments.signature';
import type {
  CreatePaymentInput,
  Payment,
  PaymentContext,
  PaymentMethod,
} from './payments.types';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PaymentsRepository)
    private readonly paymentsRepository: PaymentsRepository,
    @Inject(MercadoPagoGateway)
    private readonly mercadoPagoGateway: MercadoPagoGateway,
  ) {}

  async getContext(
    bookingId: string,
    renterId: string,
  ): Promise<PaymentContext> {
    const booking = await this.paymentsRepository.findBookingForRenter(
      bookingId,
      renterId,
    );

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    return {
      booking,
      mercadoPago: {
        enabled: this.mercadoPagoGateway.enabled,
        publicKey: this.mercadoPagoGateway.publicKey || null,
      },
      payment: await this.paymentsRepository.findLatestByBooking(bookingId),
    };
  }

  async create(input: CreatePaymentInput, renterId: string): Promise<Payment> {
    const booking = await this.paymentsRepository.findBookingForRenter(
      input.bookingId,
      renterId,
    );

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    let attempt = await this.paymentsRepository.findByIdempotencyKey(
      input.idempotencyKey,
    );

    if (attempt && attempt.bookingId !== booking.id) {
      throw new ConflictException(
        'A chave idempotente já pertence a outro pagamento.',
      );
    }

    if (attempt && !['created', 'error'].includes(attempt.status)) {
      return attempt;
    }

    if (booking.status !== 'pending') {
      throw new ConflictException(
        'Somente reservas pendentes podem receber um novo pagamento.',
      );
    }

    if (!this.mercadoPagoGateway.enabled) {
      throw new ServiceUnavailableException(
        'O Mercado Pago ainda não foi configurado neste ambiente.',
      );
    }

    const method: PaymentMethod =
      input.paymentMethodId.toLowerCase() === 'pix' ? 'pix' : 'card';
    this.validateMethod(input, method);

    if (!attempt) {
      const active = await this.paymentsRepository.findActiveByBooking(
        booking.id,
      );
      if (active) {
        throw new ConflictException(
          'Esta reserva já possui um pagamento ativo.',
        );
      }

      try {
        attempt = await this.paymentsRepository.createAttempt({
          amount: booking.totalPrice,
          bookingId: booking.id,
          idempotencyKey: input.idempotencyKey,
          method,
          paymentMethodId: input.paymentMethodId,
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException(
            'Esta reserva acabou de receber outra tentativa de pagamento.',
          );
        }
        throw error;
      }
    }

    try {
      const provider = await this.mercadoPagoGateway.createPayment({
        amount: booking.totalPrice,
        description: `Reserva Riddy - ${booking.vehicle.make} ${booking.vehicle.model}`,
        externalReference: booking.id,
        idempotencyKey: input.idempotencyKey,
        installments: method === 'card' ? input.installments : undefined,
        issuerId: input.issuerId,
        method,
        payerEmail: booking.renterEmail,
        payerIdentification: input.payerIdentification,
        paymentMethodId: input.paymentMethodId,
        token: method === 'card' ? input.token : undefined,
      });
      const payment = await this.paymentsRepository.updateFromProvider(
        attempt.id,
        provider,
      );
      await this.synchronizeBooking(payment);
      return payment;
    } catch (error) {
      const message = paymentErrorMessage(error);
      await this.paymentsRepository.markFailure(attempt.id, message);
      throw new BadGatewayException(message);
    }
  }

  async cancel(
    id: string,
    idempotencyKey: string,
    renterId: string,
  ): Promise<Payment> {
    const payment = await this.requireOwnedPayment(id, renterId);
    const existingAction =
      await this.paymentsRepository.findActionByKey(idempotencyKey);

    if (
      existingAction &&
      (existingAction.paymentId !== payment.id ||
        existingAction.type !== 'cancel')
    ) {
      throw new ConflictException(
        'A chave idempotente já pertence a outra operação.',
      );
    }
    if (existingAction?.status === 'succeeded') {
      return payment;
    }

    if (!['pending', 'in_process'].includes(payment.status)) {
      throw new ConflictException(
        'Somente pagamentos pendentes ou em processamento podem ser cancelados.',
      );
    }
    if (!payment.providerPaymentId) {
      throw new ConflictException('O pagamento ainda não possui ID externo.');
    }

    const action =
      existingAction ??
      (await this.paymentsRepository.createAction({
        idempotencyKey,
        paymentId: payment.id,
        type: 'cancel',
      }));
    if (action.paymentId !== payment.id || action.type !== 'cancel') {
      throw new ConflictException(
        'A chave idempotente já pertence a outra operação.',
      );
    }
    if (action.status === 'succeeded') {
      return payment;
    }

    try {
      const provider = await this.mercadoPagoGateway.cancelPayment(
        payment.providerPaymentId,
        idempotencyKey,
      );
      const updated = await this.paymentsRepository.updateFromProvider(
        payment.id,
        provider,
      );
      await this.paymentsRepository.completeAction(action.id);
      await this.paymentsRepository.updateBookingStatus(
        payment.bookingId,
        'cancelled',
      );
      return updated;
    } catch (error) {
      const message = paymentErrorMessage(error);
      await this.paymentsRepository.failAction(action.id, message);
      throw new BadGatewayException(message);
    }
  }

  async refund(
    id: string,
    idempotencyKey: string,
    renterId: string,
  ): Promise<Payment> {
    const payment = await this.requireOwnedPayment(id, renterId);
    const existingAction =
      await this.paymentsRepository.findActionByKey(idempotencyKey);

    if (
      existingAction &&
      (existingAction.paymentId !== payment.id ||
        existingAction.type !== 'refund')
    ) {
      throw new ConflictException(
        'A chave idempotente já pertence a outra operação.',
      );
    }
    if (existingAction?.status === 'succeeded') {
      return payment;
    }

    if (payment.status !== 'approved') {
      throw new ConflictException(
        'Somente pagamentos aprovados podem ser reembolsados.',
      );
    }
    if (!payment.providerPaymentId) {
      throw new ConflictException('O pagamento ainda não possui ID externo.');
    }

    const action =
      existingAction ??
      (await this.paymentsRepository.createAction({
        idempotencyKey,
        paymentId: payment.id,
        type: 'refund',
      }));
    if (action.paymentId !== payment.id || action.type !== 'refund') {
      throw new ConflictException(
        'A chave idempotente já pertence a outra operação.',
      );
    }
    if (action.status === 'succeeded') {
      return payment;
    }

    try {
      const result = await this.mercadoPagoGateway.refundPayment(
        payment.providerPaymentId,
        idempotencyKey,
      );
      const provider = {
        ...result.payment,
        status: 'refunded' as const,
      };
      const updated = await this.paymentsRepository.updateFromProvider(
        payment.id,
        provider,
      );
      await this.paymentsRepository.completeAction(action.id, result.id);
      await this.paymentsRepository.updateBookingStatus(
        payment.bookingId,
        'cancelled',
      );
      return updated;
    } catch (error) {
      const message = paymentErrorMessage(error);
      await this.paymentsRepository.failAction(action.id, message);
      throw new BadGatewayException(message);
    }
  }

  async processWebhook(input: {
    action: string;
    body: Record<string, unknown>;
    dataId: string;
    notificationId: string;
    requestId: string;
    signature: string;
  }): Promise<void> {
    if (!this.mercadoPagoGateway.webhookSecret) {
      throw new ServiceUnavailableException(
        'A assinatura de webhook não foi configurada.',
      );
    }

    const valid = validateMercadoPagoSignature({
      dataId: input.dataId,
      requestId: input.requestId,
      secret: this.mercadoPagoGateway.webhookSecret,
      signature: input.signature,
    });
    if (!valid) {
      throw new UnauthorizedException('Assinatura de webhook inválida.');
    }

    const eventKey = `${input.notificationId}:${input.action}`;
    const claimed = await this.paymentsRepository.claimWebhook({
      action: input.action,
      eventKey,
      payload: input.body,
      providerPaymentId: input.dataId,
    });
    if (!claimed) {
      return;
    }

    const payment = await this.paymentsRepository.findByProviderId(
      input.dataId,
    );
    if (!payment) {
      throw new NotFoundException('Pagamento do webhook não encontrado.');
    }

    const provider = await this.mercadoPagoGateway.getPayment(input.dataId);
    const updated = await this.paymentsRepository.updateFromProvider(
      payment.id,
      provider,
    );
    await this.synchronizeBooking(updated);
    await this.paymentsRepository.markWebhookProcessed(eventKey);
  }

  private async requireOwnedPayment(
    id: string,
    renterId: string,
  ): Promise<Payment> {
    const payment = await this.paymentsRepository.findByIdForRenter(
      id,
      renterId,
    );
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado.');
    }
    return payment;
  }

  private validateMethod(
    input: CreatePaymentInput,
    method: PaymentMethod,
  ): void {
    if (method === 'card' && (!input.token || !input.installments)) {
      throw new BadRequestException(
        'Token e número de parcelas são obrigatórios para cartão.',
      );
    }

    if (method === 'pix' && !input.payerIdentification) {
      throw new BadRequestException(
        'O documento do pagador é obrigatório para Pix.',
      );
    }
  }

  private async synchronizeBooking(payment: Payment): Promise<void> {
    if (payment.status === 'approved') {
      await this.paymentsRepository.updateBookingStatus(
        payment.bookingId,
        'confirmed',
      );
    } else if (
      ['cancelled', 'refunded', 'charged_back'].includes(payment.status)
    ) {
      await this.paymentsRepository.updateBookingStatus(
        payment.bookingId,
        'cancelled',
      );
    }
  }
}

function paymentErrorMessage(error: unknown): string {
  if (error instanceof PaymentGatewayError) {
    return error.message;
  }

  return error instanceof Error
    ? error.message
    : 'O provedor não conseguiu processar o pagamento.';
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === '23505',
  );
}
