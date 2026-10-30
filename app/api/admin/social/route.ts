import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { toPublicPost } from '@/lib/social/feed';
import { facebookConfigured } from '@/lib/social/facebook';
import { getSettings, KEYS } from '@/lib/social/settings';
import { tiktokAppConfigured, tiktokMode } from '@/lib/social/tiktok';
import type { AdminSocialDTO, DeliveryStatus, SocialPlatform } from '@/lib/social/types';

export const dynamic = 'force-dynamic';

/** Connection status and the last 20 posts for /admin/social. Never includes token values. */
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const s = await getSettings([
    KEYS.igToken,
    KEYS.igTokenExpiresAt,
    KEYS.igTokenRefreshedAt,
    KEYS.igRefreshError,
    KEYS.watchSince,
    KEYS.lastSyncAt,
    KEYS.lastSyncError,
    KEYS.tiktokRefreshToken,
    KEYS.tiktokRefreshExpiresAt,
  ]);
  const posts = await prisma.socialPost.findMany({
    orderBy: { postedAt: 'desc' },
    take: 20,
    include: { deliveries: { orderBy: { platform: 'asc' } } },
  });

  const igConfigured = Boolean(s[KEYS.igToken] || process.env.IG_ACCESS_TOKEN);
  const tiktokApp = tiktokAppConfigured();
  const tiktokLinked = Boolean(s[KEYS.tiktokRefreshToken]);

  const dto: AdminSocialDTO = {
    instagram: {
      configured: igConfigured,
      detail: !igConfigured
        ? 'Set IG_ACCESS_TOKEN in Vercel.'
        : s[KEYS.igRefreshError]
          ? `Last token refresh failed: ${s[KEYS.igRefreshError]}`
          : s[KEYS.igTokenRefreshedAt]
            ? `Token refreshed ${new Date(s[KEYS.igTokenRefreshedAt]!).toLocaleDateString('en-US')}; refreshes weekly.`
            : 'Using IG_ACCESS_TOKEN; the first refresh sets the expiry date.',
      expiresAt: s[KEYS.igTokenExpiresAt],
      lastSyncAt: s[KEYS.lastSyncAt],
      lastSyncError: s[KEYS.lastSyncError],
      watchSince: s[KEYS.watchSince],
    },
    facebook: {
      configured: facebookConfigured(),
      detail: facebookConfigured()
        ? `Page ${process.env.FB_PAGE_ID}. Page tokens don't expire.`
        : 'Set FB_PAGE_ID and FB_PAGE_TOKEN in Vercel.',
      expiresAt: null,
    },
    tiktok: {
      configured: tiktokApp && tiktokLinked,
      mode: tiktokMode(),
      appConfigured: tiktokApp,
      detail: !tiktokApp
        ? 'Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET in Vercel.'
        : !tiktokLinked
          ? 'App is set up. Click Connect TikTok to link the account.'
          : tiktokMode() === 'inbox'
            ? 'Videos land in the TikTok inbox; open the app and tap Post.'
            : `Videos post directly (privacy ${process.env.TIKTOK_PRIVACY || 'SELF_ONLY'}).`,
      expiresAt: tiktokApp && tiktokLinked ? s[KEYS.tiktokRefreshExpiresAt] : null,
    },
    posts: posts.map((p) => ({
      ...toPublicPost(p),
      hidden: p.hidden,
      deliveries: p.deliveries.map((d) => ({
        id: d.id,
        platform: d.platform as SocialPlatform,
        status: d.status as DeliveryStatus,
        remoteId: d.remoteId,
        error: d.error,
        attempts: d.attempts,
        updatedAt: d.updatedAt.toISOString(),
      })),
    })),
  };
  return NextResponse.json(dto);
}
