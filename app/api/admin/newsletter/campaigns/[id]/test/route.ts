import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { isResendConfigured } from '@/lib/newsletter/config';
import { EMAIL_RE, normalizeEmail } from '@/lib/newsletter/data';
import { SendError, sendTestEmail } from '@/lib/newsletter/send';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  if (!isResendConfigured()) return NextResponse.json({ error: 'Sending isn’t connected yet (no Resend key).' }, { status: 503 });
  const { id } = await params;
  const { to } = (await request.json().catch(() => ({}))) as { to?: string };
  const email = normalizeEmail(to ?? '');
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: 'Newsletter not found.' }, { status: 404 });
  try {
    await sendTestEmail(campaign, email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof SendError ? error.status : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not send the test.' }, { status });
  }
}
