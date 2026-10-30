import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, verifyOAuthState } from '@/lib/social/tiktok';

export const dynamic = 'force-dynamic';

/**
 * TikTok OAuth redirect target. It lives outside /api/admin because the
 * admin cookie is SameSite=Strict on path /api/admin and isn't sent on a
 * cross-site redirect from tiktok.com; the signed, 10-minute `state` from
 * the admin-only connect route proves the flow started there.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const back = (result: string) => NextResponse.redirect(new URL(`/admin/social?tiktok=${result}`, url.origin));

  if (!verifyOAuthState(url.searchParams.get('state'))) return back('bad_state');
  const code = url.searchParams.get('code');
  if (!code) return back(url.searchParams.get('error') === 'access_denied' ? 'denied' : 'error');
  try {
    await exchangeCode(code);
    return back('connected');
  } catch (error) {
    console.error('TikTok OAuth exchange failed:', error);
    return back('error');
  }
}
