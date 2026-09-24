import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { sendAttendeeMessage } from '@/lib/events/email';

export const maxDuration = 120;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const { subject, body, audience = 'confirmed' } = (await request.json().catch(() => ({}))) as {
    subject?: string;
    body?: string;
    audience?: 'confirmed' | 'waitlist' | 'all';
  };
  if (!subject?.trim() || !body?.trim()) return NextResponse.json({ error: 'Add a subject and a message.' }, { status: 400 });
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  const statuses = audience === 'all' ? ['confirmed', 'waitlist'] : [audience];
  const regs = await prisma.eventRegistration.findMany({ where: { eventId: id, status: { in: statuses } } });
  let sent = 0;
  for (const r of regs) if (await sendAttendeeMessage(event, r, subject.trim(), body)) sent++;
  return NextResponse.json({ sent });
}
