import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const csv = (v: string | null) => (v == null ? '' : /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const rows = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'asc' } });
  const lines = [
    'email,status,source,joined,unsubscribed',
    ...rows.map((r) =>
      [r.email, r.status, r.source, r.createdAt.toISOString(), r.unsubscribedAt?.toISOString() ?? null].map(csv).join(',')
    ),
  ];
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="newsletter-subscribers-${date}.csv"`,
    },
  });
}
