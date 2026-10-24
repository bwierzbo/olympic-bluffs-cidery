import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import {
  getEvents,
  isPastEvent,
  nextEventFrom,
  type NextEvent,
  type SiteEvent,
} from '@/lib/content';
import { formatTimeRange, toPublicDTOs } from './service';
import { TICKETED_EVENTS_TAG } from './cache-tags';

/**
 * Every event the public site lists: the hand-edited ones in
 * data/events.json (festival, outside events like Yoga + Cider) plus the
 * published ticketed events from the admin. If the database is unreachable
 * the JSON events still show.
 */

const DEFAULT_IMAGE = '/images/farm/the-fields.jpeg';

function firstParagraph(text: string): string {
  const p = text.split(/\n\s*\n/)[0]?.trim() ?? '';
  return p.length > 200 ? `${p.slice(0, 197).trimEnd()}…` : p;
}

// The root layout (header pill, status strip) reads this on every render,
// so it must not hit the database each time: that kept Neon awake around the
// clock and exhausted its compute quota. Cached under a tag that
// refreshPublicEventPages() expires after any event change, with an hourly
// backstop so seats freed by expired holds show up eventually.
const loadTicketedSiteEvents = unstable_cache(
  async (): Promise<SiteEvent[]> => {
    const events = await prisma.event.findMany({ where: { status: 'published' }, orderBy: { startsAt: 'asc' } });
    const dtos = await toPublicDTOs(events);
    return dtos.map((e) => ({
      slug: e.slug,
      title: e.title,
      kind: 'class',
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      timeLabel: formatTimeRange(e.startsAt, e.endsAt),
      location: e.location,
      summary: firstParagraph(e.description),
      image: e.image || DEFAULT_IMAGE,
      price: e.pricePerSeat,
      registration: 'internal',
      href: `/events/${e.slug}`,
      ticketUrl: null,
      seatsLeft: e.seatsLeft,
      soldOut: e.registration === 'sold_out',
    }));
  },
  ['ticketed-site-events'],
  { tags: [TICKETED_EVENTS_TAG], revalidate: 3600 },
);

async function ticketedSiteEvents(): Promise<SiteEvent[]> {
  // Errors are thrown out of the cached function, so a database outage is
  // never cached as "no events".
  try {
    return await loadTicketedSiteEvents();
  } catch (error) {
    console.error('Ticketed events unavailable:', error);
    return [];
  }
}

export async function getAllEvents(): Promise<SiteEvent[]> {
  const all = [...getEvents(), ...(await ticketedSiteEvents())];
  return all.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

export async function getAllUpcomingEvents(now: Date = new Date()): Promise<SiteEvent[]> {
  return (await getAllEvents()).filter((e) => !isPastEvent(e, now));
}

export async function getAllPastEvents(now: Date = new Date()): Promise<SiteEvent[]> {
  return (await getAllEvents()).filter((e) => isPastEvent(e, now)).reverse();
}

export async function getNextEventAll(now: Date = new Date()): Promise<NextEvent | null> {
  return nextEventFrom(await getAllUpcomingEvents(now));
}
