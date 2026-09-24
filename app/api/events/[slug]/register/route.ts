import { after, NextResponse } from 'next/server';
import { refreshPublicEventPages } from '@/lib/events/revalidate';
import { prisma } from '@/lib/prisma';
import { EventError, register } from '@/lib/events/service';
import { sendRegistrationConfirmation, sendWaitlistConfirmation } from '@/lib/events/email';
import type { RegisterRequest, RegisterResponse } from '@/lib/events/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const { slug } = await params;
  let body: RegisterRequest;
  try {
    body = (await request.json()) as RegisterRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid request.', code: 'INVALID' }, { status: 400 });
  }

  try {
    const registration = await register(slug, body);
    const event = await prisma.event.findUniqueOrThrow({ where: { id: registration.eventId } });
    // Emails go out after the response so a slow mail server never delays the confirmation screen.
    after(async () => {
      if (registration.status === 'waitlist') await sendWaitlistConfirmation(event, registration);
      else await sendRegistrationConfirmation(event, registration);
    });
    const res: RegisterResponse = {
      registration: {
        id: registration.id,
        status: registration.status as RegisterResponse['registration']['status'],
        seats: registration.seats,
        amountPaid: registration.amountPaid,
      },
    };
    refreshPublicEventPages();
    return NextResponse.json(res);
  } catch (error) {
    if (error instanceof EventError) {
      return NextResponse.json({ error: error.message, code: error.code, ...error.extra }, { status: error.status });
    }
    console.error('Registration failed:', error);
    return NextResponse.json({ error: 'Something went wrong. You haven’t been charged; please try again.' }, { status: 500 });
  }
}
