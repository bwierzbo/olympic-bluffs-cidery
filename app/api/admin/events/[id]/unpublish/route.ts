import { NextRequest, NextResponse } from 'next/server';
import { refreshPublicEventPages } from '@/lib/events/revalidate';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { toAdminDTO } from '@/lib/events/service';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const confirmed = await prisma.eventRegistration.count({ where: { eventId: id, status: { in: ['confirmed', 'pending'] } } });
  if (confirmed > 0) {
    return NextResponse.json(
      { error: 'People are already registered. Cancel the event instead so they’re notified.' },
      { status: 409 }
    );
  }
  const updated = await prisma.event.updateMany({ where: { id, status: 'published' }, data: { status: 'draft' } });
  if (updated.count === 0) return NextResponse.json({ error: 'Only published events can be unpublished.' }, { status: 409 });
  refreshPublicEventPages();
  return NextResponse.json({ event: await toAdminDTO(await prisma.event.findUniqueOrThrow({ where: { id } })) });
}
