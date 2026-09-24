import { NextRequest, NextResponse } from 'next/server';
import { refreshPublicEventPages } from '@/lib/events/revalidate';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { toRegistrationDTO } from '@/lib/events/service';

type Ctx = { params: Promise<{ id: string }> };

/** Owner adds someone by hand (comp, paid in person). No email is sent. */
export async function POST(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const { name, email, phone, seats, note } = (await request.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    phone?: string;
    seats?: number;
    note?: string;
  };
  if (!name?.trim()) return NextResponse.json({ error: 'Enter a name.' }, { status: 400 });
  const n = Number(seats ?? 1);
  if (!Number.isInteger(n) || n < 1) return NextResponse.json({ error: 'Seats must be at least 1.' }, { status: 400 });
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  const registration = await prisma.eventRegistration.create({
    data: {
      eventId: id,
      name: name.trim(),
      email: (email ?? '').trim().toLowerCase(),
      phone: phone?.trim() || null,
      seats: n,
      amountPaid: 0,
      status: 'confirmed',
      adminNotes: note?.trim() || 'Added by hand',
    },
  });
  refreshPublicEventPages();
  return NextResponse.json({ registration: toRegistrationDTO(registration) });
}
