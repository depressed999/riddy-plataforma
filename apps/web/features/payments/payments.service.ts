import type {
  CreatePaymentInput,
  Payment,
  PaymentContext,
} from './payments.types';

export class PaymentUnauthorizedError extends Error {}

export async function getPaymentContext(
  bookingId: string,
): Promise<PaymentContext> {
  const response = await fetch(`/api/v1/payments/booking/${bookingId}`, {
    credentials: 'include',
  });
  return parseResponse<PaymentContext>(response);
}

export async function createPayment(
  input: CreatePaymentInput,
): Promise<Payment> {
  const response = await fetch('/api/v1/payments', {
    body: JSON.stringify(input),
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  return parseResponse<Payment>(response);
}

export async function cancelPayment(
  id: string,
  idempotencyKey: string,
): Promise<Payment> {
  return paymentAction(id, 'cancel', idempotencyKey);
}

export async function refundPayment(
  id: string,
  idempotencyKey: string,
): Promise<Payment> {
  return paymentAction(id, 'refund', idempotencyKey);
}

async function paymentAction(
  id: string,
  action: 'cancel' | 'refund',
  idempotencyKey: string,
): Promise<Payment> {
  const response = await fetch(`/api/v1/payments/${id}/${action}`, {
    body: JSON.stringify({ idempotencyKey }),
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });
  return parseResponse<Payment>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);

  if (response.status === 401) {
    throw new PaymentUnauthorizedError('Sua sessão expirou. Entre novamente.');
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(' ')
          : typeof payload.message === 'string'
            ? payload.message
            : undefined
        : undefined;
    throw new Error(message || 'Não foi possível processar o pagamento.');
  }

  return payload as T;
}
