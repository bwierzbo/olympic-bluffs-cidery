import { NextRequest, NextResponse } from 'next/server';
import { refreshPublicEventPages } from '@/lib/events/revalidate';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { createEvent, releaseExpiredHolds, toAdminDTO, toAdminDTOs } from '@/lib/events/service';
import { errorResponse } from '@/lib/events/admin-api';
import type { EventInput } from '@/lib/events/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  await releaseExpiredHolds();
  const events = await prisma.event.findMany({ orderBy: { startsAt: 'asc' } });
  return NextResponse.json({ events: await toAdminDTOs(events) });
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const input = (await request.json()) as EventInput;
    const event = await createEvent(input);
    refreshPublicEventPages();
    return NextResponse.json({ event: await toAdminDTO(event) });
  } catch (error) {
    return errorResponse(error, 'Could not create the event.');
  }
}
