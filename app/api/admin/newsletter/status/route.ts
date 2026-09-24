import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { isAiConfigured, isResendConfigured, NEWSLETTER_FROM } from '@/lib/newsletter/config';
import type { NewsletterStatusDTO } from '@/lib/newsletter/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const subscribedCount = await prisma.newsletterSubscriber.count({ where: { status: 'subscribed' } });
  const body: NewsletterStatusDTO = {
    resendConfigured: isResendConfigured(),
    fromAddress: NEWSLETTER_FROM,
    aiConfigured: isAiConfigured(),
    subscribedCount,
  };
  return NextResponse.json(body);
}
