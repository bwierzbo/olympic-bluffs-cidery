import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { releaseExpiredHolds } from '@/lib/events/service';
import { sendReminder } from '@/lib/events/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Daily job (vercel.json crons): releases stale seat holds and emails a
 * reminder to everyone confirmed for an event starting in the next 36 hours.
 * Vercel sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const released = await releaseExpiredHolds();
  const now = new Date();
  const soon = new Date(now.getTime() + 36 * 60 * 60 * 1000);
  const regs = await prisma.eventRegistration.findMany({
    where: {
      status: 'confirmed',
      reminderSentAt: null,
      email: { not: '' },
      event: { status: 'published', startsAt: { gt: now, lte: soon } },
    },
    include: { event: true },
  });
  let reminded = 0;
  for (const { event, ...r } of regs) {
    await sendReminder(event, r);
    await prisma.eventRegistration.update({ where: { id: r.id }, data: { reminderSentAt: new Date() } });
    reminded++;
  }
  return NextResponse.json({ released, reminded });
}
