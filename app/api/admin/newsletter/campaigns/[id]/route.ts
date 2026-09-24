import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { toCampaignDTO } from '@/lib/newsletter/data';
import { markStaleSends } from '@/lib/newsletter/send';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  await markStaleSends();
  const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: 'Newsletter not found.' }, { status: 404 });
  return NextResponse.json({ campaign: toCampaignDTO(campaign) });
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const input = (await request.json().catch(() => ({}))) as Partial<Record<'subject' | 'previewText' | 'body' | 'aiBrief', unknown>>;
  const data: { subject?: string; previewText?: string; body?: string; aiBrief?: string } = {};
  for (const key of ['subject', 'previewText', 'body', 'aiBrief'] as const) {
    if (typeof input[key] === 'string') data[key] = input[key] as string;
  }
  // Only drafts are editable.
  const updated = await prisma.newsletterCampaign.updateMany({ where: { id, status: 'draft' }, data });
  if (updated.count === 0) {
    const exists = await prisma.newsletterCampaign.findUnique({ where: { id }, select: { id: true } });
    return exists
      ? NextResponse.json({ error: 'This newsletter has started sending and can no longer be edited.' }, { status: 409 })
      : NextResponse.json({ error: 'Newsletter not found.' }, { status: 404 });
  }
  const campaign = await prisma.newsletterCampaign.findUniqueOrThrow({ where: { id } });
  return NextResponse.json({ campaign: toCampaignDTO(campaign) });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const deleted = await prisma.newsletterCampaign.deleteMany({ where: { id, status: 'draft' } });
  if (deleted.count === 0) return NextResponse.json({ error: 'Only drafts can be deleted.' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
