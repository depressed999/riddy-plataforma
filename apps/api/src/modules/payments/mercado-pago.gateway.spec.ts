import type { ConfigService } from '@nestjs/config';

import {
  MercadoPagoGateway,
  PaymentGatewayError,
} from './mercado-pago.gateway';

describe('MercadoPagoGateway', () => {
  const fetchMock = jest.fn();
  let gateway: MercadoPagoGateway;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as typeof fetch;
    const values: Record<string, string> = {
      MERCADO_PAGO_ACCESS_TOKEN: 'TEST-access-token',
      MERCADO_PAGO_API_URL: 'https://api.mercadopago.test',
      MERCADO_PAGO_PUBLIC_KEY: 'TEST-public-key',
      MERCADO_PAGO_WEBHOOK_URL: 'https://example.com/webhook',
      MERCADO_PAGO_WEBHOOK_SECRET: 'secret',
    };
    const config = {
      get: jest.fn((key: string, fallback = '') => values[key] ?? fallback),
    } as unknown as ConfigService;
    gateway = new MercadoPagoGateway(config);
  });

  it('sends card data with authorization and idempotency headers', async () => {
    fetchMock.mockResolvedValue(response(paymentResponse('approved')));

    await expect(
      gateway.createPayment({
        amount: 1350,
        description: 'Reserva Riddy',
        externalReference: 'booking-1',
        idempotencyKey: 'idem-1',
        installments: 2,
        method: 'card',
        payerEmail: 'renter@example.com',
        paymentMethodId: 'visa',
        token: 'card-token',
      }),
    ).resolves.toMatchObject({ status: 'approved' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mercadopago.test/v1/payments',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer TEST-access-token',
          'X-Idempotency-Key': 'idem-1',
        }),
        method: 'POST',
      }),
    );
    const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(options.body))).toMatchObject({
      external_reference: 'booking-1',
      installments: 2,
      notification_url: 'https://example.com/webhook',
      payment_method_id: 'visa',
      token: 'card-token',
      transaction_amount: 1350,
    });
  });

  it('maps Pix QR data and rejects provider failures', async () => {
    fetchMock.mockResolvedValueOnce(
      response({
        ...paymentResponse('pending'),
        payment_method_id: 'pix',
        point_of_interaction: {
          transaction_data: {
            qr_code: '000201...',
            qr_code_base64: 'base64-pix',
            ticket_url: 'https://mercadopago.test/ticket',
          },
        },
      }),
    );

    await expect(
      gateway.createPayment({
        amount: 1350,
        description: 'Reserva Riddy',
        externalReference: 'booking-1',
        idempotencyKey: 'idem-pix',
        method: 'pix',
        payerEmail: 'renter@example.com',
        payerIdentification: { number: '12345678909', type: 'CPF' },
        paymentMethodId: 'pix',
      }),
    ).resolves.toMatchObject({
      pixQrCode: '000201...',
      pixQrCodeBase64: 'base64-pix',
      status: 'pending',
    });

    fetchMock.mockResolvedValueOnce(
      response({ message: 'invalid token' }, 400),
    );
    await expect(gateway.getPayment('invalid')).rejects.toBeInstanceOf(
      PaymentGatewayError,
    );
  });

  it('calls cancellation and full refund endpoints', async () => {
    fetchMock
      .mockResolvedValueOnce(response(paymentResponse('cancelled')))
      .mockResolvedValueOnce(response({ id: 'refund-1' }))
      .mockResolvedValueOnce(response(paymentResponse('refunded')));

    await gateway.cancelPayment('pay-1', 'cancel-idem');
    await expect(
      gateway.refundPayment('pay-1', 'refund-idem'),
    ).resolves.toMatchObject({
      id: 'refund-1',
      payment: { status: 'refunded' },
    });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://api.mercadopago.test/v1/payments/pay-1',
      'https://api.mercadopago.test/v1/payments/pay-1/refunds',
      'https://api.mercadopago.test/v1/payments/pay-1',
    ]);
  });
});

function response(body: unknown, status = 200): Response {
  return {
    json: async () => body,
    ok: status >= 200 && status < 300,
    status,
  } as Response;
}

function paymentResponse(status: string): Record<string, unknown> {
  return {
    date_approved: status === 'approved' ? new Date().toISOString() : null,
    id: 987654321,
    payment_method_id: 'visa',
    payment_type_id: 'credit_card',
    status,
    status_detail: status,
  };
}
