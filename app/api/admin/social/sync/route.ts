import { NextRequest, NextResponse } from 'next/server';
import { refreshSocialPages } from '@/lib/social/revalidate';
import { requireAdmin } from '@/lib/admin-auth';
import { runSocialSync } from '@/lib/social/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** "Sync now" on /admin/social: the same run the cron job does. */
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const result = await runSocialSync();
  if (result.imported > 0 || result.updated > 0) refreshSocialPages();
  return NextResponse.json(result);
}
