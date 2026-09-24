import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';
import { getAllProducts } from '@/lib/ciders';
import { getMakers } from '@/lib/content';
import { getLavenderProducts } from '@/lib/lavender-products';
import { getSiteConfig } from '@/lib/site-config';

// Rebuilt at most hourly so new ciders (VinoShipper) and lavender products
// (Square) show up without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const config = getSiteConfig();
  const page = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly') => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  const entries: MetadataRoute.Sitemap = [
    page('/', 1, 'daily'),
    page('/visit', 0.9),
    page('/farm', 0.7, 'monthly'),
    page('/events', 0.8, 'daily'),
    page('/stay', 0.7, 'monthly'),
    page('/makers', 0.6),
    page('/about', 0.5, 'monthly'),
    page('/policies/shipping', 0.2, 'monthly'),
    page('/policies/returns', 0.2, 'monthly'),
    page('/policies/privacy', 0.1, 'monthly'),
    page('/policies/terms', 0.1, 'monthly'),
  ];

  if (config.events.active) entries.push(page(config.events.href, 0.7));

  // The shop pages are only listed while they are switched on in site-config.
  if (config.navigation.showCidery) {
    entries.push(page('/cider', 0.9, 'daily'));
    try {
      for (const c of await getAllProducts()) entries.push(page(`/cider/${c.slug}`, 0.6));
    } catch {
      /* VinoShipper unreachable: list the index only */
    }
  }
  if (config.navigation.showLavender) {
    entries.push(page('/lavender', 0.9, 'daily'));
    try {
      for (const p of await getLavenderProducts()) entries.push(page(`/products/${p.id}`, 0.5));
    } catch {
      /* Square unreachable: list the index only */
    }
  }

  for (const m of getMakers()) {
    if (!m.placeholder) entries.push(page(`/makers/${m.slug}`, 0.4, 'monthly'));
  }

  return entries;
}
