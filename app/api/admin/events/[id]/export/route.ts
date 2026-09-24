import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const csv = (v: string | number | null | undefined) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { registrations: { where: { status: { not: 'pending' } }, orderBy: { createdAt: 'asc' } } },
  });
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  const rows = [
    'name,email,phone,seats,paid,status,checked_in,registered,notes',
    ...event.registrations.map((r) =>
      [
        r.name,
        r.email,
        r.phone,
        r.seats,
        (r.amountPaid / 100).toFixed(2),
        r.status,
        r.checkedInAt ? 'yes' : '',
        r.createdAt.toISOString(),
        r.adminNotes,
      ]
        .map(csv)
        .join(',')
    ),
  ];
  return new NextResponse(rows.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug}-roster.csv"`,
    },
  });
}
