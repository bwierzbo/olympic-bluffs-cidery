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
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  if (event.status === 'cancelled') return NextResponse.json({ error: 'Cancelled events can’t be published.' }, { status: 409 });
  const missing = [
    !event.title.trim() && 'a title',
    !event.location.trim() && 'a location',
    event.capacity < 1 && 'a capacity',
  ].filter(Boolean);
  if (missing.length) return NextResponse.json({ error: `Add ${missing.join(', ')} before publishing.` }, { status: 400 });
  if (event.startsAt.getTime() < Date.now()) return NextResponse.json({ error: 'This event’s date has passed.' }, { status: 400 });
  const updated = await prisma.event.update({ where: { id }, data: { status: 'published' } });
  refreshPublicEventPages();
  return NextResponse.json({ event: await toAdminDTO(updated) });
}
