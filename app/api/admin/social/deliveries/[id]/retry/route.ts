import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { publishDelivery } from '@/lib/social/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Retry a failed cross-post right now, regardless of the automatic attempt limit. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const delivery = await prisma.socialDelivery.findUnique({ where: { id } });
  if (!delivery) return NextResponse.json({ error: 'Delivery not found.' }, { status: 404 });
  if (delivery.status !== 'failed') return NextResponse.json({ error: 'Only failed deliveries can be retried.' }, { status: 409 });
  await publishDelivery(id, true);
  const after = await prisma.socialDelivery.findUnique({ where: { id } });
  return NextResponse.json({ status: after?.status, error: after?.error ?? null });
}
