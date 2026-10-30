import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { crossPostCaption, isIgOnly } from './caption';
import { facebookConfigured, publishToFacebook } from './facebook';
import { fetchRecentMedia, getInstagramToken, refreshInstagramTokenIfDue } from './instagram';
import { mirrorPost } from './mirror';
import { getSetting, KEYS, setSettings } from './settings';
import { publishToTikTok, tiktokConnected } from './tiktok';
import type { SocialMediaItem, SocialPlatform, SyncResult } from './types';

/**
 * The Instagram watcher. Each run:
 *   1. refreshes the Instagram token when due,
 *   2. mirrors any new posts into Blob and the social_posts table,
 *   3. publishes pending/failed deliveries to Facebook and TikTok.
 *
 * Safety rules:
 *   - Posts from before the watcher's first run (watchSince) are imported for
 *     the website but their deliveries are marked skipped: no history blasts.
 *   - A delivery is claimed (pending/failed → publishing) with a conditional
 *     update before anything is sent, so overlapping runs can't double-post.
 *     A run that dies mid-publish leaves it "publishing"; that is never
 *     retried automatically (see releaseStuckDeliveries).
 */
export const MAX_ATTEMPTS = 3;
const RETRY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const STUCK_AFTER_MS = 10 * 60 * 1000;
// Leave room within the 300s function limit to record the outcome.
const IMPORT_BUDGET_MS = 150_000;
const RUN_BUDGET_MS = 240_000;

function message(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 1000);
}

async function platformReady(platform: SocialPlatform): Promise<boolean> {
  return platform === 'facebook' ? facebookConfigured() : tiktokConnected();
}

/** Mirrors new Instagram posts and picks up caption edits on known ones. */
async function syncInstagram(result: SyncResult, startedAt: number): Promise<void> {
  const token = await getInstagramToken();
  if (!token) throw new Error('Instagram is not configured (IG_ACCESS_TOKEN).');

  // The first run fixes the cut-off: anything already on Instagram is history.
  let watchSince = await getSetting(KEYS.watchSince);
  if (!watchSince) {
    watchSince = new Date(startedAt).toISOString();
    await setSettings({ [KEYS.watchSince]: watchSince });
  }
  const cutoff = Date.parse(watchSince);

  const media = await fetchRecentMedia(token);
  result.fetched = media.length;
  const existing = new Map(
    (await prisma.socialPost.findMany({ where: { id: { in: media.map((m) => m.id) } }, select: { id: true, caption: true, permalink: true } })).map(
      (p) => [p.id, p]
    )
  );

  for (const item of media) {
    const caption = item.caption ?? '';
    const known = existing.get(item.id);
    if (known) {
      // Captions can be edited on Instagram after posting.
      if (known.caption !== caption || known.permalink !== item.permalink) {
        await prisma.socialPost.update({ where: { id: item.id }, data: { caption, permalink: item.permalink } });
        result.updated++;
      }
      continue;
    }
    // Whatever doesn't fit this run is picked up by the next one.
    if (Date.now() - startedAt > IMPORT_BUDGET_MS) continue;

    try {
      const mirrored = await mirrorPost(item);
      if (!mirrored) {
        result.errors.push(`Post ${item.id}: Instagram returned no usable image or cover.`);
        continue;
      }
      const postedAt = new Date(item.timestamp);
      const isNew = postedAt.getTime() > cutoff;
      const igOnly = isIgOnly(caption);
      const platforms: SocialPlatform[] = item.media_type === 'VIDEO' && mirrored.videoUrl ? ['facebook', 'tiktok'] : ['facebook'];
      await prisma.socialPost.create({
        data: {
          id: item.id,
          caption,
          mediaType: item.media_type,
          imageUrl: mirrored.imageUrl,
          videoUrl: mirrored.videoUrl,
          media: mirrored.media as unknown as Prisma.InputJsonValue,
          permalink: item.permalink,
          postedAt,
          deliveries: {
            create: platforms.map((platform) => ({
              platform,
              status: isNew && !igOnly ? 'pending' : 'skipped',
              error: !isNew ? 'Posted before the watcher started' : igOnly ? 'Caption has #igonly' : null,
            })),
          },
        },
      });
      result.imported++;
    } catch (error) {
      // Another run created it first: nothing to do.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') continue;
      result.errors.push(`Post ${item.id}: ${message(error)}`);
    }
  }
}

/** A delivery whose run died mid-publish: mark failed and out of retries, since it may have gone out. */
async function releaseStuckDeliveries(): Promise<void> {
  await prisma.socialDelivery.updateMany({
    where: { status: 'publishing', updatedAt: { lt: new Date(Date.now() - STUCK_AFTER_MS) } },
    data: {
      status: 'failed',
      attempts: MAX_ATTEMPTS,
      error: 'Interrupted while publishing. Check the platform before retrying, it may have posted.',
    },
  });
}

/**
 * Claims and publishes one delivery. `manual` (the admin Retry button)
 * ignores the attempt limit and the 7-day window. Returns true on success.
 */
export async function publishDelivery(deliveryId: string, manual = false): Promise<boolean> {
  const delivery = await prisma.socialDelivery.findUnique({ where: { id: deliveryId }, include: { post: true } });
  if (!delivery || !['pending', 'failed'].includes(delivery.status)) return false;
  if (!manual && delivery.attempts >= MAX_ATTEMPTS) return false;

  const claimed = await prisma.socialDelivery.updateMany({
    where: { id: delivery.id, status: delivery.status, attempts: delivery.attempts },
    data: { status: 'publishing', attempts: { increment: 1 }, error: null },
  });
  if (claimed.count !== 1) return false; // another run got it

  const { post } = delivery;
  const caption = crossPostCaption(post.caption);
  try {
    if (!(await platformReady(delivery.platform as SocialPlatform))) {
      throw new Error(delivery.platform === 'facebook' ? 'Facebook is not configured.' : 'TikTok is not connected.');
    }
    let remoteId: string;
    let note: string | null = null;
    if (delivery.platform === 'facebook') {
      remoteId = await publishToFacebook(
        { ...post, media: post.media as unknown as SocialMediaItem[] },
        caption
      );
    } else {
      if (!post.videoUrl) throw new Error('No video file for this post.');
      const res = await publishToTikTok(post.videoUrl, caption);
      remoteId = res.publishId;
      note = res.note ?? null;
    }
    await prisma.socialDelivery.update({ where: { id: delivery.id }, data: { status: 'done', remoteId, error: note } });
    return true;
  } catch (error) {
    await prisma.socialDelivery.update({ where: { id: delivery.id }, data: { status: 'failed', error: message(error) } });
    return false;
  }
}

/** Publishes everything due: new pending deliveries plus failed ones with attempts left, from the last 7 days. */
async function fanOut(result: SyncResult, startedAt: number): Promise<void> {
  await releaseStuckDeliveries();
  const since = new Date(Date.now() - RETRY_WINDOW_MS);

  // Pending deliveries that aged out without ever being sent (e.g. the platform wasn't set up yet).
  await prisma.socialDelivery.updateMany({
    where: { status: 'pending', post: { postedAt: { lt: since } } },
    data: { status: 'skipped', error: 'Not sent within 7 days of posting' },
  });

  const due = await prisma.socialDelivery.findMany({
    where: {
      OR: [{ status: 'pending' }, { status: 'failed', attempts: { lt: MAX_ATTEMPTS } }],
      post: { postedAt: { gte: since } },
    },
    orderBy: { post: { postedAt: 'asc' } },
    select: { id: true, platform: true },
  });

  const ready = new Map<string, boolean>();
  for (const d of due) {
    if (Date.now() - startedAt > RUN_BUDGET_MS) break;
    if (!ready.has(d.platform)) ready.set(d.platform, await platformReady(d.platform as SocialPlatform));
    if (!ready.get(d.platform)) continue; // stays pending until the platform is connected
    if (await publishDelivery(d.id)) result.published++;
    else result.failed++;
  }
}

/** One full watcher run (cron, GitHub Actions, or the admin "Sync now" button). */
export async function runSocialSync(): Promise<SyncResult> {
  const startedAt = Date.now();
  const result: SyncResult = { fetched: 0, imported: 0, updated: 0, published: 0, failed: 0, errors: [] };
  try {
    await refreshInstagramTokenIfDue();
    await syncInstagram(result, startedAt);
  } catch (error) {
    result.errors.unshift(message(error));
  }
  // Retries still run if Instagram is unreachable this time.
  try {
    await fanOut(result, startedAt);
  } catch (error) {
    result.errors.push(message(error));
  }
  await setSettings({
    [KEYS.lastSyncAt]: new Date().toISOString(),
    [KEYS.lastSyncError]: result.errors.length ? result.errors.join('\n').slice(0, 2000) : null,
  });
  return result;
}
