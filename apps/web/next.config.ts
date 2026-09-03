import type { NextConfig } from 'next';

import { createApiProxyDestination } from './lib/api-proxy';
import { createSecurityHeaders } from './lib/security-headers';

const nextConfig: NextConfig = {
  async headers() {
    const securityHeaders = createSecurityHeaders({
      apiUrl: process.env.API_URL,
      development: process.env.NODE_ENV !== 'production',
      storageOrigin: process.env.NEXT_PUBLIC_STORAGE_ORIGIN,
    });
    const privateRoutes = [
      '/admin/:path*',
      '/anfitriao/:path*',
      '/checkout',
      '/mensagens/:path*',
      '/pagamentos/:path*',
      '/perfil/:path*',
      '/reservas',
      '/verificacoes/:path*',
    ];

    return [
      { headers: securityHeaders, source: '/:path*' },
      ...privateRoutes.map((source) => ({
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
        source,
      })),
    ];
  },
  async rewrites() {
    return [
      {
        destination: createApiProxyDestination(process.env.API_URL),
        source: '/api/v1/:path*',
      },
    ];
  },
  images: { formats: ['image/avif', 'image/webp'] },
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ['@riddy/config'],
};

export default nextConfig;
