import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { toSubscriberDTO } from '@/lib/newsletter/data';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const { status } = (await request.json().catch(() => ({}))) as { status?: string };
  if (status !== 'subscribed' && status !== 'unsubscribed') {
    return NextResponse.json({ error: 'Status must be subscribed or unsubscribed.' }, { status: 400 });
  }
  try {
    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id },
      data: { status, unsubscribedAt: status === 'unsubscribed' ? new Date() : null },
    });
    return NextResponse.json({ subscriber: toSubscriberDTO(subscriber) });
  } catch {
    return NextResponse.json({ error: 'Subscriber not found.' }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  await prisma.newsletterSubscriber.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
