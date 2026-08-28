import type { MetadataRoute } from 'next';

import { configuredSiteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = configuredSiteUrl();
  return [
    {
      changeFrequency: 'weekly',
      priority: 1,
      url: siteUrl,
    },
    {
      changeFrequency: 'daily',
      priority: 0.9,
      url: `${siteUrl}/buscar`,
    },
  ];
}
