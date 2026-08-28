import { createHmac, timingSafeEqual } from 'node:crypto';

export function validateMercadoPagoSignature({
  dataId,
  requestId,
  secret,
  signature,
}: {
  dataId: string;
  requestId: string;
  secret: string;
  signature: string;
}): boolean {
  const parts = new Map(
    signature.split(',').map((part) => {
      const [key, ...value] = part.trim().split('=');
      return [key, value.join('=')] as const;
    }),
  );
  const timestamp = parts.get('ts');
  const received = parts.get('v1');

  if (!timestamp || !received || !/^[a-f0-9]{64}$/i.test(received)) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  const receivedBuffer = Buffer.from(received, 'hex');

  return (
    receivedBuffer.length === expected.length &&
    timingSafeEqual(receivedBuffer, expected)
  );
}
