import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  ProviderPayment,
  ProviderPaymentInput,
  PaymentStatus,
} from './payments.types';

type MercadoPagoPaymentResponse = {
  date_approved?: string | null;
  id: number | string;
  payment_method_id?: string;
  payment_type_id?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  status: string;
  status_detail?: string;
};

@Injectable()
export class MercadoPagoGateway {
  private readonly accessToken: string;
  private readonly apiUrl: string;
  private readonly notificationUrl: string;
  readonly publicKey: string;
  readonly webhookSecret: string;

  constructor(@Inject(ConfigService) configService: ConfigService) {
    this.accessToken = configService.get<string>(
      'MERCADO_PAGO_ACCESS_TOKEN',
      '',
    );
    this.publicKey = configService.get<string>('MERCADO_PAGO_PUBLIC_KEY', '');
    this.webhookSecret = configService.get<string>(
      'MERCADO_PAGO_WEBHOOK_SECRET',
      '',
    );
    this.notificationUrl = configService.get<string>(
      'MERCADO_PAGO_WEBHOOK_URL',
      '',
    );
    this.apiUrl = configService.get<string>(
      'MERCADO_PAGO_API_URL',
      'https://api.mercadopago.com',
    );
  }

  get enabled(): boolean {
    return Boolean(this.accessToken && this.publicKey);
  }

  async createPayment(input: ProviderPaymentInput): Promise<ProviderPayment> {
    const body: Record<string, unknown> = {
      description: input.description,
      external_reference: input.externalReference,
      installments: input.installments,
      issuer_id: input.issuerId,
      metadata: { booking_id: input.externalReference },
      payer: {
        email: input.payerEmail,
        identification: input.payerIdentification,
      },
      payment_method_id: input.paymentMethodId,
      token: input.token,
      transaction_amount: input.amount,
    };

    if (this.notificationUrl) {
      body.notification_url = this.notificationUrl;
    }

    return this.request('/v1/payments', {
      body,
      idempotencyKey: input.idempotencyKey,
      method: 'POST',
    });
  }

  getPayment(providerPaymentId: string): Promise<ProviderPayment> {
    return this.request(`/v1/payments/${providerPaymentId}`, {
      method: 'GET',
    });
  }

  cancelPayment(
    providerPaymentId: string,
    idempotencyKey: string,
  ): Promise<ProviderPayment> {
    return this.request(`/v1/payments/${providerPaymentId}`, {
      body: { status: 'cancelled' },
      idempotencyKey,
      method: 'PUT',
    });
  }

  async refundPayment(
    providerPaymentId: string,
    idempotencyKey: string,
  ): Promise<{ id: string; payment: ProviderPayment }> {
    const response = await this.rawRequest<{ id: number | string }>(
      `/v1/payments/${providerPaymentId}/refunds`,
      { body: {}, idempotencyKey, method: 'POST' },
    );
    const payment = await this.getPayment(providerPaymentId);
    return { id: String(response.id), payment };
  }

  private async request(
    path: string,
    options: RequestOptions,
  ): Promise<ProviderPayment> {
    const response = await this.rawRequest<MercadoPagoPaymentResponse>(
      path,
      options,
    );
    return mapPayment(response);
  }

  private async rawRequest<T>(
    path: string,
    { body, idempotencyKey, method }: RequestOptions,
  ): Promise<T> {
    if (!this.accessToken) {
      throw new PaymentGatewayError(
        'A credencial privada do Mercado Pago não foi configurada.',
        503,
      );
    }

    const response = await fetch(`${this.apiUrl}${path}`, {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
      },
      method,
      signal: AbortSignal.timeout(15_000),
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      throw new PaymentGatewayError(
        providerErrorMessage(payload) ||
          `O Mercado Pago respondeu com status ${response.status}.`,
        response.status,
      );
    }

    return payload as T;
  }
}

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

type RequestOptions = {
  body?: Record<string, unknown>;
  idempotencyKey?: string;
  method: 'GET' | 'POST' | 'PUT';
};

function mapPayment(payment: MercadoPagoPaymentResponse): ProviderPayment {
  const transaction = payment.point_of_interaction?.transaction_data;

  return {
    approvedAt: payment.date_approved ?? null,
    id: String(payment.id),
    paymentMethodId: payment.payment_method_id ?? 'unknown',
    paymentTypeId: payment.payment_type_id ?? null,
    pixQrCode: transaction?.qr_code ?? null,
    pixQrCodeBase64: transaction?.qr_code_base64 ?? null,
    pixTicketUrl: transaction?.ticket_url ?? null,
    status: mapStatus(payment.status),
    statusDetail: payment.status_detail ?? null,
  };
}

function mapStatus(status: string): PaymentStatus {
  const statuses: Record<string, PaymentStatus> = {
    approved: 'approved',
    authorized: 'in_process',
    cancelled: 'cancelled',
    charged_back: 'charged_back',
    in_process: 'in_process',
    in_mediation: 'in_process',
    pending: 'pending',
    refunded: 'refunded',
    rejected: 'rejected',
  };

  return statuses[status] ?? 'error';
}

function providerErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message;
  }

  if ('error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }

  return null;
}
