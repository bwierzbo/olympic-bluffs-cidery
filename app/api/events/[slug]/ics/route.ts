import { prisma } from '@/lib/prisma';
import { eventIcs } from '@/lib/events/email';

type Ctx = { params: Promise<{ slug: string }> };

/** "Add to calendar" file for an event. */
export async function GET(_request: Request, { params }: Ctx) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event || event.status !== 'published') return new Response('Not found', { status: 404 });
  return new Response(eventIcs(event), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug}.ics"`,
    },
  });
}
