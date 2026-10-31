import { createHash } from 'crypto';
import { getSettings, KEYS, setSettings } from './settings';

/**
 * Two ways to read the account:
 * - Through the linked Facebook Page (IG_USER_ID set): graph.facebook.com
 *   with FB_PAGE_TOKEN (instagram_basic). Page tokens don't expire, so there's
 *   nothing to refresh.
 * - Instagram API with Instagram Login (graph.instagram.com, scope
 *   instagram_business_basic). The long-lived token is seeded from
 *   IG_ACCESS_TOKEN; refreshed tokens are kept in social_settings because a
 *   refresh returns a new token and env vars can't be rewritten at runtime.
 */
const GRAPH = 'https://graph.instagram.com';
const FB_GRAPH = () => `https://graph.facebook.com/${process.env.META_GRAPH_VERSION?.trim() || 'v26.0'}`;
const REFRESH_EVERY_MS = 7 * 24 * 60 * 60 * 1000;
const RETRY_FAILED_REFRESH_MS = 24 * 60 * 60 * 1000;

const MEDIA_FIELDS =
  'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}';

export interface IgChild {
  id: string;
  media_type: 'IMAGE' | 'VIDEO';
  media_url?: string;
  thumbnail_url?: string;
}

export interface IgMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  children?: { data: IgChild[] };
}

/** The Instagram user ID when the account is read through its Facebook Page. */
export function instagramPageUserId(): string | null {
  return process.env.IG_USER_ID?.trim() || null;
}

function fingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex').slice(0, 16);
}

async function igFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  const data = (await res.json().catch(() => null)) as (T & { error?: { message?: string } }) | null;
  if (!res.ok || !data || data.error) {
    throw new Error(`Instagram: ${data?.error?.message ?? `HTTP ${res.status}`}`);
  }
  return data;
}

/**
 * The token to use: the stored (refreshed) one, unless IG_ACCESS_TOKEN has
 * been replaced since, in which case the new env token wins.
 */
export async function getInstagramToken(): Promise<string | null> {
  if (instagramPageUserId()) return process.env.FB_PAGE_TOKEN?.trim() || null;
  const seed = process.env.IG_ACCESS_TOKEN?.trim();
  const s = await getSettings([KEYS.igToken, KEYS.igTokenSeed]);
  if (seed && s[KEYS.igTokenSeed] !== fingerprint(seed)) {
    await setSettings({
      [KEYS.igToken]: seed,
      [KEYS.igTokenSeed]: fingerprint(seed),
      [KEYS.igTokenExpiresAt]: null,
      [KEYS.igTokenRefreshedAt]: null,
      [KEYS.igRefreshAttemptAt]: null,
      [KEYS.igRefreshError]: null,
    });
    return seed;
  }
  return s[KEYS.igToken] ?? seed ?? null;
}

/**
 * Refreshes the long-lived token about weekly. Tokens last ~60 days and
 * can't be refreshed until they're 24 hours old, so a failure just waits a
 * day and tries again; the current token keeps working meanwhile.
 */
export async function refreshInstagramTokenIfDue(): Promise<void> {
  if (instagramPageUserId()) return;
  const token = await getInstagramToken();
  if (!token) return;
  const s = await getSettings([KEYS.igTokenRefreshedAt, KEYS.igRefreshAttemptAt]);
  const now = Date.now();
  const refreshedAt = s[KEYS.igTokenRefreshedAt] ? Date.parse(s[KEYS.igTokenRefreshedAt]!) : 0;
  const attemptAt = s[KEYS.igRefreshAttemptAt] ? Date.parse(s[KEYS.igRefreshAttemptAt]!) : 0;
  if (now - refreshedAt < REFRESH_EVERY_MS || now - attemptAt < RETRY_FAILED_REFRESH_MS) return;

  try {
    const data = await igFetch<{ access_token: string; expires_in: number }>(
      `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
    );
    await setSettings({
      [KEYS.igToken]: data.access_token,
      [KEYS.igTokenExpiresAt]: new Date(now + data.expires_in * 1000).toISOString(),
      [KEYS.igTokenRefreshedAt]: new Date(now).toISOString(),
      [KEYS.igRefreshAttemptAt]: new Date(now).toISOString(),
      [KEYS.igRefreshError]: null,
    });
  } catch (error) {
    await setSettings({
      [KEYS.igRefreshAttemptAt]: new Date(now).toISOString(),
      [KEYS.igRefreshError]: error instanceof Error ? error.message : String(error),
    });
  }
}

/** The account's most recent posts, newest first. */
export async function fetchRecentMedia(token: string, limit = 50): Promise<IgMedia[]> {
  const params = new URLSearchParams({ fields: MEDIA_FIELDS, limit: String(limit), access_token: token });
  const pageUserId = instagramPageUserId();
  const url = pageUserId ? `${FB_GRAPH()}/${pageUserId}/media` : `${GRAPH}/me/media`;
  const data = await igFetch<{ data: IgMedia[] }>(`${url}?${params}`);
  return data.data ?? [];
}
