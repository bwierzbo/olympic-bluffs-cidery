import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EMAIL_RE, normalizeEmail } from '@/lib/newsletter/data';

export const dynamic = 'force-dynamic';

/**
 * Public signup (footer and cider page forms). Signing up again after
 * unsubscribing resubscribes the address.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? '');
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { status: 'subscribed', unsubscribedAt: null },
      create: { email, source: body.source?.slice(0, 40) ?? null },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Newsletter signup failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Sign-up isn’t working right now. Email info@olympicbluffs.com and we’ll add you.' },
      { status: 503 }
    );
  }
}
