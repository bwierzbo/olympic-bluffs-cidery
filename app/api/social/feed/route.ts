import { NextRequest, NextResponse } from 'next/server';
import { getVisiblePosts } from '@/lib/social/feed';
import { SITE_URL } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

/**
 * Public JSON feed of our Instagram posts for partner sites (e.g. the Sequim
 * Lavender Growers Association). See docs/social-feed-for-partners.md.
 *   ?limit=12 (max 50)   ?tag=sequimlavender (caption hashtag filter)
 */
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const limit = Math.min(Math.max(parseInt(params.get('limit') ?? '', 10) || 12, 1), 50);
  const tag = params.get('tag')?.slice(0, 100) || undefined;
  try {
    const posts = await getVisiblePosts({ limit, tag });
    return NextResponse.json(
      { source: SITE_URL, updatedAt: new Date().toISOString(), posts },
      { headers: { ...HEADERS, 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
    );
  } catch (error) {
    console.error('Social feed failed:', error);
    return NextResponse.json({ error: 'Feed unavailable' }, { status: 503, headers: { ...HEADERS, 'Cache-Control': 'no-store' } });
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { ...HEADERS, 'Access-Control-Max-Age': '86400' } });
}
