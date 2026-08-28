import type { MetadataRoute } from 'next';

import { configuredSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = configuredSiteUrl();
  return {
    rules: {
      allow: ['/', '/buscar', '/veiculos/'],
      disallow: [
        '/admin',
        '/anfitriao',
        '/cadastro',
        '/checkout',
        '/entrar',
        '/mensagens',
        '/pagamentos',
        '/perfil',
        '/recuperar-senha',
        '/redefinir-senha',
        '/reservas',
        '/verificacoes',
      ],
      userAgent: '*',
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
