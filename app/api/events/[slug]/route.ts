import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toPublicDTOs } from '@/lib/events/service';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ slug: string }> };

/** Public event details with live seat count (the registration form refreshes from here). */
export async function GET(_request: Request, { params }: Ctx) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event || event.status === 'draft') return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  const [dto] = await toPublicDTOs([event]);
  return NextResponse.json(dto);
}
