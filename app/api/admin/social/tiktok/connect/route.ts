import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { authorizeUrl, createOAuthState, tiktokAppConfigured } from '@/lib/social/tiktok';

export const dynamic = 'force-dynamic';

/** "Connect TikTok": sends the admin to TikTok's consent screen. */
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  if (!tiktokAppConfigured()) {
    return NextResponse.json({ error: 'Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET first.' }, { status: 503 });
  }
  return NextResponse.redirect(authorizeUrl(createOAuthState()));
}
