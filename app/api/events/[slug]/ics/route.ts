import { prisma } from '@/lib/prisma';
import { eventIcs } from '@/lib/events/email';
import { buildIcs } from '@/lib/mailer';
import { getEvent } from '@/lib/content';
import { SITE_URL } from '@/lib/site-url';

type Ctx = { params: Promise<{ slug: string }> };

function icsResponse(slug: string, body: string) {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
    },
  });
}

/** "Add to calendar" file for an event: a ticketed one, or a page-backed one from data/events.json. */
export async function GET(_request: Request, { params }: Ctx) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } }).catch(() => null);
  if (event && event.status === 'published') return icsResponse(event.slug, eventIcs(event));

  const listed = getEvent(slug);
  if (!listed || !listed.href?.startsWith('/')) return new Response('Not found', { status: 404 });
  return icsResponse(
    slug,
    buildIcs({
      uid: `${slug}-${listed.startsAt.slice(0, 10)}@olympicbluffs.com`,
      title: `${listed.title} at Olympic Bluffs`,
      description: `${listed.summary}\n${SITE_URL}${listed.href}`,
      start: new Date(listed.startsAt),
      end: new Date(listed.endsAt),
    })
  );
}
