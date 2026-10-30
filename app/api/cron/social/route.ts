import { NextRequest, NextResponse } from 'next/server';
import { refreshSocialPages } from '@/lib/social/revalidate';
import { runSocialSync } from '@/lib/social/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Instagram watcher. Runs every 30 minutes from GitHub Actions
 * (.github/workflows/social-sync.yml) with a daily Vercel cron as a backstop.
 * Both send `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await runSocialSync();
  if (result.imported > 0 || result.updated > 0) refreshSocialPages();
  return NextResponse.json(result);
}
