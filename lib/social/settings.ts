import { prisma } from '@/lib/prisma';

/**
 * Key/value store for the social pipeline's rotating tokens and watcher
 * state. Server only: none of these values may ever reach the browser.
 */
export const KEYS = {
  watchSince: 'watchSince', // ISO time the watcher started; older posts are never cross-posted
  lastSyncAt: 'lastSyncAt',
  lastSyncError: 'lastSyncError',
  igToken: 'ig.token',
  igTokenSeed: 'ig.tokenSeed', // fingerprint of the IG_ACCESS_TOKEN the stored token came from
  igTokenExpiresAt: 'ig.tokenExpiresAt',
  igTokenRefreshedAt: 'ig.tokenRefreshedAt',
  igRefreshAttemptAt: 'ig.refreshAttemptAt',
  igRefreshError: 'ig.refreshError',
  tiktokAccessToken: 'tiktok.accessToken',
  tiktokAccessExpiresAt: 'tiktok.accessExpiresAt',
  tiktokRefreshToken: 'tiktok.refreshToken',
  tiktokRefreshExpiresAt: 'tiktok.refreshExpiresAt',
  tiktokOpenId: 'tiktok.openId',
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.socialSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const rows = await prisma.socialSetting.findMany({ where: { key: { in: keys } } });
  const out: Record<string, string | null> = Object.fromEntries(keys.map((k) => [k, null]));
  for (const row of rows) out[row.key] = row.value;
  return out;
}

/** Upserts each key; a null value deletes it. */
export async function setSettings(values: Record<string, string | null>): Promise<void> {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      value === null
        ? prisma.socialSetting.deleteMany({ where: { key } })
        : prisma.socialSetting.upsert({ where: { key }, create: { key, value }, update: { value } })
    )
  );
}
