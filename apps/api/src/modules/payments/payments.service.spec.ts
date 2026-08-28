import { createHmac } from 'node:crypto';

import { BadGatewayException, BadRequestException } from '@nestjs/common';

import type { MercadoPagoGateway } from './mercado-pago.gateway';
import type { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import type {
  Payment,
  PaymentAction,
  PaymentBooking,
  ProviderPayment,
} from './payments.types';

const bookingId = '11111111-1111-4111-8111-111111111111';
const renterId = '22222222-2222-4222-8222-222222222222';
const paymentId = '33333333-3333-4333-8333-333333333333';
const idempotencyKey = '44444444-4444-4444-8444-444444444444';

describe('PaymentsService', () => {
  let gateway: jest.Mocked<MercadoPagoGateway>;
  let repository: jest.Mocked<PaymentsRepository>;
  let service: PaymentsService;

  beforeEach(() => {
    gateway = {
      cancelPayment: jest.fn(),
      createPayment: jest.fn(),
      enabled: true,
      getPayment: jest.fn(),
      publicKey: 'TEST-public-key',
      refundPayment: jest.fn(),
      webhookSecret: 'webhook-secret',
    } as unknown as jest.Mocked<MercadoPagoGateway>;
    repository = {
      claimWebhook: jest.fn(),
      completeAction: jest.fn(),
      createAction: jest.fn(),
      createAttempt: jest.fn(),
      failAction: jest.fn(),
      findActiveByBooking: jest.fn(),
      findActionByKey: jest.fn(),
      findBookingForRenter: jest.fn(),
      findByIdForRenter: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      findByProviderId: jest.fn(),
      findLatestByBooking: jest.fn(),
      markFailure: jest.fn(),
      markWebhookProcessed: jest.fn(),
      updateBookingStatus: jest.fn(),
      updateFromProvider: jest.fn(),
    } as unknown as jest.Mocked<PaymentsRepository>;
    service = new PaymentsService(repository, gateway);

    repository.findBookingForRenter.mockResolvedValue(bookingFixture());
    repository.findByIdempotencyKey.mockResolvedValue(null);
    repository.findActionByKey.mockResolvedValue(null);
    repository.findActiveByBooking.mockResolvedValue(null);
    repository.createAttempt.mockResolvedValue(paymentFixture());
  });

  it('creates an approved card payment with server-owned price and payer', async () => {
    const provider = providerFixture({ status: 'approved' });
    const approved = paymentFixture({ status: 'approved' });
    gateway.createPayment.mockResolvedValue(provider);
    repository.updateFromProvider.mockResolvedValue(approved);

    await expect(
      service.create(
        {
          bookingId,
          idempotencyKey,
          installments: 2,
          paymentMethodId: 'visa',
          token: 'card-token',
        },
        renterId,
      ),
    ).resolves.toEqual(approved);
    expect(gateway.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1350,
        externalReference: bookingId,
        payerEmail: 'renter@example.com',
      }),
    );
    expect(repository.updateBookingStatus).toHaveBeenCalledWith(
      bookingId,
      'confirmed',
    );
  });

  it('creates a pending Pix with QR data without confirming the booking', async () => {
    const provider = providerFixture({
      paymentMethodId: 'pix',
      pixQrCode: '000201...',
      status: 'pending',
    });
    const pending = paymentFixture({
      method: 'pix',
      paymentMethodId: 'pix',
      pixQrCode: '000201...',
      status: 'pending',
    });
    gateway.createPayment.mockResolvedValue(provider);
    repository.updateFromProvider.mockResolvedValue(pending);

    await expect(
      service.create(
        {
          bookingId,
          idempotencyKey,
          payerIdentification: { number: '12345678909', type: 'CPF' },
          paymentMethodId: 'pix',
        },
        renterId,
      ),
    ).resolves.toMatchObject({ pixQrCode: '000201...', status: 'pending' });
    expect(repository.updateBookingStatus).not.toHaveBeenCalled();
  });

  it('returns an idempotent result without charging twice', async () => {
    const approved = paymentFixture({ status: 'approved' });
    repository.findByIdempotencyKey.mockResolvedValue(approved);

    await expect(
      service.create(
        {
          bookingId,
          idempotencyKey,
          installments: 1,
          paymentMethodId: 'master',
          token: 'token',
        },
        renterId,
      ),
    ).resolves.toEqual(approved);
    expect(gateway.createPayment).not.toHaveBeenCalled();
  });

  it('persists provider failures and allows rejected payment responses', async () => {
    gateway.createPayment.mockRejectedValueOnce(new Error('network failure'));
    repository.markFailure.mockResolvedValue(
      paymentFixture({ status: 'error' }),
    );

    await expect(
      service.create(
        {
          bookingId,
          idempotencyKey,
          installments: 1,
          paymentMethodId: 'visa',
          token: 'token',
        },
        renterId,
      ),
    ).rejects.toBeInstanceOf(BadGatewayException);
    expect(repository.markFailure).toHaveBeenCalledWith(
      paymentId,
      'network failure',
    );

    const rejected = paymentFixture({ status: 'rejected' });
    gateway.createPayment.mockResolvedValueOnce(
      providerFixture({ status: 'rejected' }),
    );
    repository.updateFromProvider.mockResolvedValueOnce(rejected);
    await expect(
      service.create(
        {
          bookingId,
          idempotencyKey,
          installments: 1,
          paymentMethodId: 'visa',
          token: 'token',
        },
        renterId,
      ),
    ).resolves.toMatchObject({ status: 'rejected' });
  });

  it('validates method-specific data', async () => {
    await expect(
      service.create(
        { bookingId, idempotencyKey, paymentMethodId: 'visa' },
        renterId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.create(
        { bookingId, idempotencyKey, paymentMethodId: 'pix' },
        renterId,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancels pending payments and refunds approved payments', async () => {
    const pending = paymentFixture({ status: 'pending' });
    const action = actionFixture('cancel');
    repository.findByIdForRenter.mockResolvedValue(pending);
    repository.createAction.mockResolvedValue(action);
    gateway.cancelPayment.mockResolvedValue(
      providerFixture({ status: 'cancelled' }),
    );
    repository.updateFromProvider.mockResolvedValue(
      paymentFixture({ status: 'cancelled' }),
    );

    await expect(
      service.cancel(paymentId, idempotencyKey, renterId),
    ).resolves.toMatchObject({ status: 'cancelled' });
    expect(repository.updateBookingStatus).toHaveBeenLastCalledWith(
      bookingId,
      'cancelled',
    );

    const approved = paymentFixture({ status: 'approved' });
    repository.findByIdForRenter.mockResolvedValue(approved);
    repository.createAction.mockResolvedValue(actionFixture('refund'));
    gateway.refundPayment.mockResolvedValue({
      id: 'refund-1',
      payment: providerFixture({ status: 'refunded' }),
    });
    repository.updateFromProvider.mockResolvedValue(
      paymentFixture({ status: 'refunded' }),
    );

    await expect(
      service.refund(paymentId, idempotencyKey, renterId),
    ).resolves.toMatchObject({ status: 'refunded' });
  });

  it('validates and deduplicates signed webhooks', async () => {
    const providerId = '987654321';
    const requestId = 'request-1';
    const timestamp = '1704908010';
    const manifest = `id:${providerId};request-id:${requestId};ts:${timestamp};`;
    const hash = createHmac('sha256', gateway.webhookSecret)
      .update(manifest)
      .digest('hex');
    repository.claimWebhook.mockResolvedValue(true);
    repository.findByProviderId.mockResolvedValue(paymentFixture());
    gateway.getPayment.mockResolvedValue(
      providerFixture({ id: providerId, status: 'approved' }),
    );
    repository.updateFromProvider.mockResolvedValue(
      paymentFixture({ status: 'approved' }),
    );

    await service.processWebhook({
      action: 'payment.updated',
      body: { data: { id: providerId }, id: 123 },
      dataId: providerId,
      notificationId: '123',
      requestId,
      signature: `ts=${timestamp},v1=${hash}`,
    });
    expect(repository.markWebhookProcessed).toHaveBeenCalledWith(
      '123:payment.updated',
    );

    repository.claimWebhook.mockResolvedValue(false);
    await service.processWebhook({
      action: 'payment.updated',
      body: { data: { id: providerId }, id: 123 },
      dataId: providerId,
      notificationId: '123',
      requestId,
      signature: `ts=${timestamp},v1=${hash}`,
    });
    expect(gateway.getPayment).toHaveBeenCalledTimes(1);
  });
});

function bookingFixture(): PaymentBooking {
  return {
    id: bookingId,
    pickupDate: '2027-02-10',
    renterEmail: 'renter@example.com',
    returnDate: '2027-02-13',
    status: 'pending',
    totalDays: 3,
    totalPrice: 1350,
    vehicle: {
      city: 'Manaus',
      id: '55555555-5555-4555-8555-555555555555',
      make: 'Tesla',
      model: 'Model Y',
      state: 'AM',
      year: 2024,
    },
  };
}

function paymentFixture(overrides: Partial<Payment> = {}): Payment {
  return {
    amount: 1350,
    approvedAt: null,
    bookingId,
    cancelledAt: null,
    createdAt: new Date().toISOString(),
    currency: 'BRL',
    failureMessage: null,
    id: paymentId,
    method: 'card',
    paymentMethodId: 'visa',
    paymentTypeId: 'credit_card',
    pixQrCode: null,
    pixQrCodeBase64: null,
    pixTicketUrl: null,
    providerPaymentId: '987654321',
    refundedAt: null,
    status: 'created',
    statusDetail: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function providerFixture(
  overrides: Partial<ProviderPayment> = {},
): ProviderPayment {
  return {
    approvedAt: null,
    id: '987654321',
    paymentMethodId: 'visa',
    paymentTypeId: 'credit_card',
    pixQrCode: null,
    pixQrCodeBase64: null,
    pixTicketUrl: null,
    status: 'pending',
    statusDetail: 'pending_waiting_payment',
    ...overrides,
  };
}

function actionFixture(type: 'cancel' | 'refund'): PaymentAction {
  return {
    id: '66666666-6666-4666-8666-666666666666',
    paymentId,
    status: 'processing',
    type,
  };
}
