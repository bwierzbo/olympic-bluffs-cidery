import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { toCampaignDTO } from '@/lib/newsletter/data';
import { markStaleSends } from '@/lib/newsletter/send';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  await markStaleSends();
  const campaigns = await prisma.newsletterCampaign.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return NextResponse.json({ campaigns: campaigns.map(toCampaignDTO) });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const campaign = await prisma.newsletterCampaign.create({ data: {} });
  return NextResponse.json({ campaign: toCampaignDTO(campaign) });
}
