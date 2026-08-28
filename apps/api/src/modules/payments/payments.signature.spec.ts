import { createHmac } from 'node:crypto';

import { validateMercadoPagoSignature } from './payments.signature';

describe('validateMercadoPagoSignature', () => {
  it('accepts the signed Mercado Pago manifest', () => {
    const secret = 'webhook-secret';
    const dataId = 'PAY-123';
    const requestId = 'request-456';
    const timestamp = '1704908010';
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
    const hash = createHmac('sha256', secret).update(manifest).digest('hex');

    expect(
      validateMercadoPagoSignature({
        dataId,
        requestId,
        secret,
        signature: `ts=${timestamp},v1=${hash}`,
      }),
    ).toBe(true);
  });

  it('rejects a modified signature', () => {
    expect(
      validateMercadoPagoSignature({
        dataId: '123',
        requestId: 'request',
        secret: 'secret',
        signature: `ts=1704908010,v1=${'0'.repeat(64)}`,
      }),
    ).toBe(false);
  });
});
