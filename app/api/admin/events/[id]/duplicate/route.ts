import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createEvent, toAdminDTO } from '@/lib/events/service';
import { errorResponse } from '@/lib/events/admin-api';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const e = await prisma.event.findUnique({ where: { id } });
  if (!e) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  try {
    const copy = await createEvent({
      title: `${e.title} (copy)`,
      description: e.description,
      image: e.image,
      imageAlt: e.imageAlt,
      startsAt: e.startsAt.toISOString(),
      endsAt: e.endsAt.toISOString(),
      location: e.location,
      capacity: e.capacity,
      pricePerSeat: e.pricePerSeat,
      maxSeatsPerOrder: e.maxSeatsPerOrder,
      requires21: e.requires21,
      waitlistEnabled: e.waitlistEnabled,
      registrationClosesAt: e.registrationClosesAt?.toISOString() ?? null,
      refundPolicy: e.refundPolicy,
    });
    return NextResponse.json({ event: await toAdminDTO(copy) });
  } catch (error) {
    return errorResponse(error, 'Could not duplicate the event.');
  }
}
