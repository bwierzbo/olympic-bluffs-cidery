import { NextRequest, NextResponse } from 'next/server';
import { refreshPublicEventPages } from '@/lib/events/revalidate';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { cancelRegistration, EventError, refundRegistration, toRegistrationDTO } from '@/lib/events/service';
import { sendRegistrationCancelled, sendRegistrationConfirmation } from '@/lib/events/email';
import { errorResponse } from '@/lib/events/admin-api';

type Ctx = { params: Promise<{ id: string; rid: string }> };
type Action = 'check_in' | 'undo_check_in' | 'cancel' | 'refund' | 'confirm_waitlist' | 'note';

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id, rid } = await params;
  const { action, note } = (await request.json().catch(() => ({}))) as { action?: Action; note?: string };
  const reg = await prisma.eventRegistration.findFirst({ where: { id: rid, eventId: id }, include: { event: true } });
  if (!reg) return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
  const { event, ...r } = reg;

  try {
    let updated = r;
    switch (action) {
      case 'check_in':
        updated = await prisma.eventRegistration.update({ where: { id: rid }, data: { checkedInAt: new Date() } });
        break;
      case 'undo_check_in':
        updated = await prisma.eventRegistration.update({ where: { id: rid }, data: { checkedInAt: null } });
        break;
      case 'note':
        updated = await prisma.eventRegistration.update({ where: { id: rid }, data: { adminNotes: note?.trim() || null } });
        break;
      case 'refund':
        updated = await refundRegistration(r, `Refund: ${event.title}`);
        await sendRegistrationCancelled(event, updated, true, note?.trim() || undefined);
        break;
      case 'cancel':
        updated = await cancelRegistration(r);
        if (r.email) await sendRegistrationCancelled(event, updated, false, note?.trim() || undefined);
        break;
      case 'confirm_waitlist': {
        if (r.status !== 'waitlist') return NextResponse.json({ error: 'This person isn’t on the waitlist.' }, { status: 409 });
        if (event.pricePerSeat > 0) {
          return NextResponse.json(
            { error: 'This is a paid event. Email the waitlist that a spot opened so they can register and pay.' },
            { status: 409 }
          );
        }
        // Only if the seats are actually free (same lock as public registration).
        updated = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "events" WHERE id = ${event.id} FOR UPDATE`;
          const taken = await tx.eventRegistration.aggregate({
            _sum: { seats: true },
            where: { eventId: event.id, OR: [{ status: 'confirmed' }, { status: 'pending', holdExpiresAt: { gt: new Date() } }] },
          });
          const left = event.capacity - (taken._sum.seats ?? 0);
          if (r.seats > left) {
            throw new EventError(
              left <= 0
                ? 'The event is full. Raise the capacity first, then confirm.'
                : `Only ${left} seat${left === 1 ? '' : 's'} free, and this person asked for ${r.seats}.`,
              409
            );
          }
          return tx.eventRegistration.update({ where: { id: rid }, data: { status: 'confirmed' } });
        });
        await sendRegistrationConfirmation(event, updated);
        break;
      }
      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
    refreshPublicEventPages();
    return NextResponse.json({ registration: toRegistrationDTO(updated) });
  } catch (error) {
    return errorResponse(error, 'Could not update the registration.');
  }
}
