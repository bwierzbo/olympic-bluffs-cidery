/**
 * Canonical site origin for absolute URLs (sitemap, social previews,
 * emails). Set NEXT_PUBLIC_SITE_URL to override, e.g. for a staging domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.olympicbluffs.com').replace(/\/+$/, '');
