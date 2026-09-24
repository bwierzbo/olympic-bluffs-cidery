import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { getSquareMode } from '@/lib/square';
import { eventLink, formatEventDateRange } from '@/lib/content';
import { getAllUpcomingEvents } from '@/lib/events/listing';
import type { CustomerInfo } from '@/lib/types';
import type { AdminOverview } from '@/lib/admin-overview';

export const dynamic = 'force-dynamic';

const DAY = 24 * 60 * 60 * 1000;

/** Everything the admin home page shows, in one request. */
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const now = Date.now();
  const since7 = new Date(now - 7 * DAY);
  const since30 = new Date(now - 30 * DAY);

  const [byStatus, last7Days, revenue, recent, subscribed, newSubs, drafts, sending, lastSent] = await Promise.all([
    prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.order.count({ where: { createdAt: { gte: since7 } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: since30 }, status: { not: 'cancelled' } },
    }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.newsletterSubscriber.count({ where: { status: 'subscribed' } }),
    prisma.newsletterSubscriber.count({ where: { status: 'subscribed', createdAt: { gte: since30 } } }),
    prisma.newsletterCampaign.count({ where: { status: 'draft' } }),
    prisma.newsletterCampaign.count({ where: { status: { in: ['sending', 'paused'] } } }),
    prisma.newsletterCampaign.findFirst({ where: { status: 'sent' }, orderBy: { sentAt: 'desc' } }),
  ]);

  const count = (s: string) => byStatus.find((r) => r.status === s)?._count.id ?? 0;

  const body: AdminOverview = {
    orders: {
      toProcess: count('confirmed'),
      processing: count('processing'),
      readyForPickup: count('ready'),
      onHold: count('on_hold'),
      last7Days,
      revenueLast30DaysCents: revenue._sum.total ?? 0,
      recent: recent.map((o) => {
        const c = o.customerInfo as unknown as CustomerInfo;
        return {
          id: o.id,
          customerName: `${c?.firstName ?? ''} ${c?.lastName ?? ''}`.trim() || c?.email || 'Customer',
          status: o.status,
          fulfillmentMethod: o.fulfillmentMethod,
          totalCents: o.total,
          createdAt: o.createdAt.toISOString(),
        };
      }),
    },
    newsletter: {
      subscribed,
      newLast30Days: newSubs,
      drafts,
      sending,
      lastSent: lastSent
        ? {
            id: lastSent.id,
            subject: lastSent.subject,
            sentAt: (lastSent.sentAt ?? lastSent.updatedAt).toISOString(),
            sentCount: lastSent.sentCount,
          }
        : null,
    },
    events: {
      upcoming: (await getAllUpcomingEvents())
        .slice(0, 3)
        .map((e) => ({ title: e.title, dates: formatEventDateRange(e), kind: e.kind, link: eventLink(e).href })),
    },
    squareMode: getSquareMode(),
  };
  return NextResponse.json(body);
}
