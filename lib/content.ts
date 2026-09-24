/**
 * Typed loaders for the site's content files in /data. Components are
 * templates over this data; the owners edit the JSON, not the components.
 */
import makersData from '@/data/makers.json';
import eventsData from '@/data/events.json';
import farmStopsData from '@/data/farm-stops.json';

export type MakerWhere = 'boutique' | 'festival' | 'collaborator';

export interface Maker {
  slug: string;
  name: string;
  craft: string;
  craftDetail: string;
  hometown: string;
  bio: string;
  portrait: string | null;
  /** Describes the photo: set it when the image shows their work or a place rather than the person. */
  portraitAlt?: string;
  /** CSS object-position focus point for the portrait crop, e.g. "65% 40%". Defaults to center. */
  portraitPosition?: string;
  gallery: string[];
  website: string | null;
  instagram: string | null;
  where: MakerWhere[];
  festivalDays: string[];
  productIds: string[];
  featured: boolean;
  placeholder?: boolean;
}

export type EventKind = 'festival' | 'class' | 'tasting' | 'external';
export type EventRegistration = 'none' | 'external' | 'internal';

export interface SiteEvent {
  slug: string;
  title: string;
  kind: EventKind;
  startsAt: string; // ISO with offset
  endsAt: string;
  timeLabel: string;
  location: string;
  summary: string;
  image: string;
  price: number | null; // cents
  registration: EventRegistration;
  href: string | null;
  ticketUrl: string | null;
  /** Ticketed events created in the admin (registration: 'internal') */
  seatsLeft?: number | null;
  soldOut?: boolean;
}

export interface FarmStop {
  slug: string;
  title: string;
  image: string;
  description: string;
}

export function getMakers(): Maker[] {
  return (makersData as { makers: Maker[] }).makers;
}

export function getMaker(slug: string): Maker | undefined {
  return getMakers().find((m) => m.slug === slug);
}

export function getFeaturedMaker(): Maker | undefined {
  const makers = getMakers();
  return makers.find((m) => m.featured) ?? makers[0];
}

export function getEvents(): SiteEvent[] {
  return [...(eventsData as { events: SiteEvent[] }).events].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

export function getEvent(slug: string): SiteEvent | undefined {
  return getEvents().find((e) => e.slug === slug);
}

export function isPastEvent(event: SiteEvent, now: Date = new Date()): boolean {
  return new Date(event.endsAt).getTime() < now.getTime();
}

export function getUpcomingEvents(now: Date = new Date()): SiteEvent[] {
  return getEvents().filter((e) => !isPastEvent(e, now));
}

export function getPastEvents(now: Date = new Date()): SiteEvent[] {
  return getEvents()
    .filter((e) => isPastEvent(e, now))
    .reverse();
}

/** Where a visitor should go to learn more or buy a ticket. */
export function eventLink(event: SiteEvent): { href: string; external: boolean } {
  if (event.registration === 'external' && event.ticketUrl) {
    return { href: event.ticketUrl, external: true };
  }
  return { href: event.href ?? `/events#${event.slug}`, external: false };
}

/** Short date like "Sat, Oct 17" in farm time. */
export function formatEventDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...opts,
  }).format(new Date(iso));
}

/** "Jul 17–20" for multi-day events, "Sat, Oct 17" otherwise. */
export function formatEventDateRange(event: SiteEvent): string {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);
  const sameDay =
    formatEventDate(event.startsAt, { weekday: undefined }) ===
    formatEventDate(event.endsAt, { weekday: undefined });
  if (sameDay) return formatEventDate(event.startsAt);
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', ...o }).format(d);
  return `${fmt(start, { month: 'short', day: 'numeric' })}–${fmt(end, { day: 'numeric' })}`;
}

export interface NextEvent {
  event: SiteEvent;
  shortLabel: string;
  href: string;
}

/** Header-pill / status-strip summary for the first event in an upcoming list. */
export function nextEventFrom(upcoming: SiteEvent[]): NextEvent | null {
  const next = upcoming[0];
  if (!next) return null;
  const { href } = eventLink(next);
  return {
    event: next,
    shortLabel: `${next.title} · ${formatEventDate(next.startsAt, { weekday: undefined })}`,
    href: next.registration === 'external' ? '/events' : href,
  };
}

/** Events from data/events.json only. Pages should prefer lib/events/listing.ts, which adds ticketed events. */
export function getNextEvent(now: Date = new Date()): NextEvent | null {
  return nextEventFrom(getUpcomingEvents(now));
}

export function getFarmStops(): FarmStop[] {
  return (farmStopsData as { stops: FarmStop[] }).stops;
}

export { formatPrice } from '@/lib/ciders';
