import { NextRequest, NextResponse } from 'next/server';
import { refreshPublicEventPages } from '@/lib/events/revalidate';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { releaseExpiredHolds, toAdminDTO, toRegistrationDTO, updateEvent } from '@/lib/events/service';
import { errorResponse } from '@/lib/events/admin-api';
import type { EventInput } from '@/lib/events/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  await releaseExpiredHolds();
  const event = await prisma.event.findUnique({ where: { id }, include: { registrations: { orderBy: { createdAt: 'asc' } } } });
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  return NextResponse.json({
    event: await toAdminDTO(event),
    registrations: event.registrations.filter((r) => r.status !== 'pending').map(toRegistrationDTO),
  });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  try {
    const input = (await request.json()) as Partial<EventInput>;
    const event = await updateEvent(id, input);
    refreshPublicEventPages();
    return NextResponse.json({ event: await toAdminDTO(event) });
  } catch (error) {
    return errorResponse(error, 'Could not save the event.');
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, include: { _count: { select: { registrations: true } } } });
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  if (event.status !== 'draft' || event._count.registrations > 0) {
    return NextResponse.json({ error: 'Only drafts with no registrations can be deleted. Cancel it instead.' }, { status: 409 });
  }
  await prisma.event.delete({ where: { id } });
  refreshPublicEventPages();
  return NextResponse.json({ ok: true });
}
