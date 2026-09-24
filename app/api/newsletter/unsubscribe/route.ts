import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Unsubscribe by token. Used by the unsubscribe page and by mail clients'
 * one-click unsubscribe (RFC 8058: POST with List-Unsubscribe=One-Click).
 * Always answers 200 so tokens can't be probed.
 */
export async function POST(request: NextRequest) {
  let token = request.nextUrl.searchParams.get('token') ?? '';
  if (!token) {
    const json = (await request.json().catch(() => null)) as { token?: string } | null;
    token = json?.token ?? '';
  }
  if (token) {
    await prisma.newsletterSubscriber.updateMany({
      where: { unsubscribeToken: token, status: 'subscribed' },
      data: { status: 'unsubscribed', unsubscribedAt: new Date() },
    });
  }
  return NextResponse.json({ ok: true });
}
