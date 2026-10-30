import { NextRequest, NextResponse } from 'next/server';
import { refreshSocialPages } from '@/lib/social/revalidate';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Hide or show a post on the website and the partner feed: `{ hidden: boolean }`. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { hidden?: unknown } | null;
  if (typeof body?.hidden !== 'boolean') return NextResponse.json({ error: 'Send { hidden: true | false }.' }, { status: 400 });
  const updated = await prisma.socialPost.updateMany({ where: { id }, data: { hidden: body.hidden } });
  if (updated.count === 0) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  refreshSocialPages();
  return NextResponse.json({ id, hidden: body.hidden });
}
