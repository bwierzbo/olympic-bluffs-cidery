import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { SITE_URL } from '@/lib/site-url';
import { getSettings, KEYS, setSettings } from './settings';

/**
 * TikTok Content Posting API, videos only.
 *
 * TIKTOK_MODE=inbox (default) uploads to the account's TikTok inbox, where
 * we tap Post in the app. Until TikTok audits the app, direct posts can only
 * be private, so inbox is the useful mode; after the audit, TIKTOK_MODE=direct
 * publishes straight away with TIKTOK_PRIVACY (default SELF_ONLY).
 */
const API = 'https://open.tiktokapis.com';
const SCOPES = 'video.upload,video.publish';
const STATE_TTL_MS = 10 * 60 * 1000;
const MB = 1024 * 1024;
// TikTok chunks must be 5–64 MB; the last one absorbs the remainder (up to 128 MB).
const CHUNK_SIZE = 10 * MB;
const SINGLE_UPLOAD_MAX = 64 * MB;
const STATUS_POLL_MS = 5000;
const STATUS_TIMEOUT_MS = 60_000;

export type TikTokMode = 'inbox' | 'direct';

export function tiktokMode(): TikTokMode {
  return process.env.TIKTOK_MODE?.trim().toLowerCase() === 'direct' ? 'direct' : 'inbox';
}

export function tiktokAppConfigured(): boolean {
  return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
}

/** Registered as the redirect URI in the TikTok developer portal. Lives outside /api/admin (see the callback route). */
export function tiktokRedirectUri(): string {
  return `${SITE_URL}/api/social/tiktok/callback`;
}

// --- OAuth state: HMAC-signed and timestamped, like lib/admin-auth.ts tokens ---

function signState(payload: string): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_PASSWORD not configured');
  return createHmac('sha256', secret).update(`tiktok-oauth:${payload}`).digest('hex');
}

export function createOAuthState(): string {
  const payload = `${Date.now()}.${randomBytes(8).toString('hex')}`;
  return `${payload}.${signState(payload)}`;
}

export function verifyOAuthState(state: string | null): boolean {
  if (!state || !process.env.ADMIN_PASSWORD) return false;
  const lastDot = state.lastIndexOf('.');
  if (lastDot === -1) return false;
  const payload = state.slice(0, lastDot);
  const signature = state.slice(lastDot + 1);
  const age = Date.now() - parseInt(payload.split('.')[0], 10);
  if (!(age >= 0 && age <= STATE_TTL_MS)) return false;
  const expected = signState(payload);
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: SCOPES,
    response_type: 'code',
    redirect_uri: tiktokRedirectUri(),
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
}

// --- Tokens: access ~24h, refresh ~1 year, both kept in social_settings ---

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  open_id?: string;
  error?: string;
  error_description?: string;
}

async function tokenRequest(params: Record<string, string>): Promise<void> {
  const res = await fetch(`${API}/v2/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      ...params,
    }),
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => null)) as TokenResponse | null;
  if (!res.ok || !data?.access_token || !data.refresh_token) {
    throw new Error(`TikTok: ${data?.error_description || data?.error || `HTTP ${res.status}`}`);
  }
  const now = Date.now();
  // TikTok may rotate the refresh token, so always keep the one that comes back.
  await setSettings({
    [KEYS.tiktokAccessToken]: data.access_token,
    [KEYS.tiktokAccessExpiresAt]: new Date(now + (data.expires_in ?? 86400) * 1000).toISOString(),
    [KEYS.tiktokRefreshToken]: data.refresh_token,
    [KEYS.tiktokRefreshExpiresAt]: new Date(now + (data.refresh_expires_in ?? 31536000) * 1000).toISOString(),
    ...(data.open_id ? { [KEYS.tiktokOpenId]: data.open_id } : {}),
  });
}

export function exchangeCode(code: string): Promise<void> {
  return tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: tiktokRedirectUri() });
}

/** A valid access token, refreshed first if it expires within 5 minutes. Null when not connected. */
export async function getTikTokAccessToken(): Promise<string | null> {
  const s = await getSettings([KEYS.tiktokAccessToken, KEYS.tiktokAccessExpiresAt, KEYS.tiktokRefreshToken]);
  if (!s[KEYS.tiktokRefreshToken]) return null;
  const expiresAt = s[KEYS.tiktokAccessExpiresAt] ? Date.parse(s[KEYS.tiktokAccessExpiresAt]!) : 0;
  if (s[KEYS.tiktokAccessToken] && expiresAt - Date.now() > 5 * 60 * 1000) return s[KEYS.tiktokAccessToken];
  await tokenRequest({ grant_type: 'refresh_token', refresh_token: s[KEYS.tiktokRefreshToken]! });
  return (await getSettings([KEYS.tiktokAccessToken]))[KEYS.tiktokAccessToken];
}

export async function tiktokConnected(): Promise<boolean> {
  return tiktokAppConfigured() && Boolean((await getSettings([KEYS.tiktokRefreshToken]))[KEYS.tiktokRefreshToken]);
}

// --- Publishing ---

async function api<T>(token: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => null)) as { data?: T; error?: { code?: string; message?: string } } | null;
  if (!res.ok || !json || (json.error?.code && json.error.code !== 'ok')) {
    throw new Error(`TikTok: ${json?.error?.message || json?.error?.code || `HTTP ${res.status}`}`);
  }
  return json.data as T;
}

interface CreatorInfo {
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  max_video_post_duration_sec: number;
}

export interface TikTokResult {
  publishId: string;
  /** Set when TikTok hadn't finished processing within the polling window. */
  note?: string;
}

/** Uploads one video (our Blob copy) with FILE_UPLOAD and waits up to ~60s for TikTok to accept it. */
export async function publishToTikTok(videoUrl: string, caption: string): Promise<TikTokResult> {
  const token = await getTikTokAccessToken();
  if (!token) throw new Error('TikTok is not connected.');

  const download = await fetch(videoUrl, { cache: 'no-store' });
  if (!download.ok) throw new Error(`Couldn't read the video copy (HTTP ${download.status})`);
  const video = Buffer.from(await download.arrayBuffer());
  const contentType = videoUrl.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';

  const size = video.length;
  const chunkSize = size <= SINGLE_UPLOAD_MAX ? size : CHUNK_SIZE;
  const totalChunks = Math.floor(size / chunkSize);
  const source_info = { source: 'FILE_UPLOAD', video_size: size, chunk_size: chunkSize, total_chunk_count: totalChunks };

  let init: { publish_id: string; upload_url: string };
  if (tiktokMode() === 'direct') {
    // Direct post must follow the creator's current settings.
    const creator = await api<CreatorInfo>(token, '/v2/post/publish/creator_info/query/');
    const privacy = process.env.TIKTOK_PRIVACY?.trim() || 'SELF_ONLY';
    if (!creator.privacy_level_options.includes(privacy)) {
      throw new Error(`TikTok won't accept privacy ${privacy}; allowed: ${creator.privacy_level_options.join(', ')}`);
    }
    init = await api(token, '/v2/post/publish/video/init/', {
      post_info: {
        title: caption.slice(0, 2200),
        privacy_level: privacy,
        disable_comment: creator.comment_disabled,
        disable_duet: creator.duet_disabled,
        disable_stitch: creator.stitch_disabled,
      },
      source_info,
    });
  } else {
    // Inbox uploads carry no caption; it's added in the TikTok app before posting.
    init = await api(token, '/v2/post/publish/inbox/video/init/', { source_info });
  }

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = i === totalChunks - 1 ? size : start + chunkSize;
    const res = await fetch(init.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(end - start),
        'Content-Range': `bytes ${start}-${end - 1}/${size}`,
      },
      body: video.subarray(start, end),
    });
    if (!res.ok) throw new Error(`TikTok upload failed on chunk ${i + 1}/${totalChunks} (HTTP ${res.status})`);
  }

  const deadline = Date.now() + STATUS_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, STATUS_POLL_MS));
    const status = await api<{ status: string; fail_reason?: string }>(token, '/v2/post/publish/status/fetch/', {
      publish_id: init.publish_id,
    });
    if (status.status === 'SEND_TO_USER_INBOX' || status.status === 'PUBLISH_COMPLETE') return { publishId: init.publish_id };
    if (status.status === 'FAILED') throw new Error(`TikTok rejected the video: ${status.fail_reason ?? 'unknown reason'}`);
  }
  // The upload went through; don't retry (that would post twice). Check the TikTok app.
  return { publishId: init.publish_id, note: 'Uploaded; TikTok was still processing after 60s.' };
}
