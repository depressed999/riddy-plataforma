type Header = { key: string; value: string };

export function createSecurityHeaders(options: {
  apiUrl?: string;
  development: boolean;
  storageOrigin?: string;
}): Header[] {
  const apiOrigin = safeOrigin(options.apiUrl, 'http://localhost:4000');
  const storageOrigin = safeOrigin(
    options.storageOrigin,
    'http://localhost:9000',
  );
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    ...(options.development ? ["'unsafe-eval'"] : []),
    'https://sdk.mercadopago.com',
    'https://*.mercadopago.com',
    'https://*.mercadopago.com.br',
    'https://*.mercadolibre.com',
  ];
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src 'self' ${apiOrigin} ${storageOrigin} ${options.development ? 'ws://localhost:* ws://127.0.0.1:*' : ''} https://api.mercadopago.com https://*.mercadopago.com https://*.mercadopago.com.br https://*.mercadolibre.com`,
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'frame-src https://*.mercadopago.com https://*.mercadopago.com.br https://*.mercadolibre.com',
    "img-src 'self' data: blob: https://*.mercadopago.com https://*.mercadopago.com.br https://*.mercadolibre.com",
    "manifest-src 'self'",
    "object-src 'none'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
    ...(options.development ? [] : ['upgrade-insecure-requests']),
  ];

  return [
    { key: 'Content-Security-Policy', value: directives.join('; ') },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), geolocation=(), microphone=()',
    },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
  ];
}

function safeOrigin(value: string | undefined, fallback: string): string {
  try {
    return new URL(value?.trim() || fallback).origin;
  } catch {
    throw new Error(`Origem inválida na política de segurança: ${value}.`);
  }
}
