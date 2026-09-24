import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Admin, APIs and the transactional pages have nothing to index.
      disallow: ['/admin', '/api/', '/shop/checkout', '/shop/success', '/shop/cancelled', '/orders/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
