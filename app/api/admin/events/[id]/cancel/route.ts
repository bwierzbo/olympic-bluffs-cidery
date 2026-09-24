import { NextRequest, NextResponse } from 'next/server';
import { refreshPublicEventPages } from '@/lib/events/revalidate';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { cancelRegistration, refundRegistration, toAdminDTO } from '@/lib/events/service';
import { sendEventCancelled } from '@/lib/events/email';
import { errorResponse } from '@/lib/events/admin-api';

export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

/** Cancels the event, emails everyone registered, and optionally refunds every payment. */
export async function POST(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const { refund = true, message } = (await request.json().catch(() => ({}))) as { refund?: boolean; message?: string };
  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    if (event.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled.' }, { status: 409 });

    const cancelled = await prisma.event.update({ where: { id }, data: { status: 'cancelled', cancelledAt: new Date() } });
    const regs = await prisma.eventRegistration.findMany({ where: { eventId: id, status: { in: ['confirmed', 'waitlist'] } } });
    let refunded = 0;
    let failed = 0;
    for (const r of regs) {
      let didRefund = false;
      try {
        if (refund && r.status === 'confirmed' && r.amountPaid > 0 && r.paymentId) {
          await refundRegistration(r, `Event cancelled: ${event.title}`);
          didRefund = true;
          refunded++;
        } else {
          await cancelRegistration(r);
        }
      } catch (error) {
        failed++;
        console.error('Refund failed during event cancel:', r.id, error);
        await cancelRegistration(r);
      }
      await sendEventCancelled(cancelled, r, didRefund, message?.trim() || undefined);
    }
    refreshPublicEventPages();
    return NextResponse.json({ event: await toAdminDTO(cancelled), refunded, failed });
  } catch (error) {
    return errorResponse(error, 'Could not cancel the event.');
  }
}
