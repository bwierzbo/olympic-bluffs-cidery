import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { EMAIL_RE, normalizeEmail, toSubscriberDTO } from '@/lib/newsletter/data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();
  const status = request.nextUrl.searchParams.get('status');
  const where: Prisma.NewsletterSubscriberWhereInput = {
    ...(q ? { email: { contains: q } } : {}),
    ...(status === 'subscribed' || status === 'unsubscribed' ? { status } : {}),
  };
  const [subscribers, subscribed, unsubscribed] = await Promise.all([
    prisma.newsletterSubscriber.findMany({ where, orderBy: { createdAt: 'desc' }, take: 1000 }),
    prisma.newsletterSubscriber.count({ where: { status: 'subscribed' } }),
    prisma.newsletterSubscriber.count({ where: { status: 'unsubscribed' } }),
  ]);
  return NextResponse.json({ subscribers: subscribers.map(toSubscriberDTO), counts: { subscribed, unsubscribed } });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };
  const clean = normalizeEmail(email ?? '');
  if (!EMAIL_RE.test(clean)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email: clean },
    update: { status: 'subscribed', unsubscribedAt: null },
    create: { email: clean, source: 'admin' },
  });
  return NextResponse.json({ subscriber: toSubscriberDTO(subscriber) });
}
