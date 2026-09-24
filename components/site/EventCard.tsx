import Image from 'next/image';
import Link from 'next/link';
import { eventLink, formatEventDateRange, formatPrice, type SiteEvent } from '@/lib/content';

const FARM_TZ = 'America/Los_Angeles';

/** Seat counts arrive on DB-backed events (registration 'internal'). */
type CardEvent = SiteEvent & { seatsLeft?: number | null; soldOut?: boolean };

function dateBlock(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: FARM_TZ }).format(d),
    month: new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: FARM_TZ }).format(d),
  };
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * One event on the /events list. Photo with a date block, title, a meta line
 * and an action that depends on how registration works for that event:
 * external tickets, a details page, or (Phase 6) on-site registration.
 */
export default function EventCard({
  event,
  past = false,
  priority = false,
}: {
  event: CardEvent;
  past?: boolean;
  priority?: boolean;
}) {
  const { day, month } = dateBlock(event.startsAt);
  const link = eventLink(event);
  const meta = [formatEventDateRange(event), event.timeLabel, event.location];
  if (event.price != null) meta.push(`${formatPrice(event.price)} per person`);

  return (
    <article
      id={event.slug}
      className={`flex flex-col border border-line bg-paper scroll-mt-24 ${past ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-ground-2">
        <Image
          src={event.image}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="object-cover"
        />
        <div className="absolute left-3 top-3 bg-paper px-3 py-2 text-center leading-none text-ink">
          <span className="block font-serif text-[30px] tabular-nums">{day}</span>
          <span className="mt-1 block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-2">
            {month}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-[22px] leading-tight">{event.title}</h3>
        <p className="mt-2 text-[13px] text-ink-2">{meta.join(' · ')}</p>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{event.summary}</p>

        {!past && (
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
            {event.registration === 'external' && event.ticketUrl ? (
              <>
                <a href={link.href} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Tickets
                </a>
                <span className="text-[12px] text-ink-3">Tickets through {hostname(event.ticketUrl)}</span>
              </>
            ) : event.registration === 'internal' ? (
              event.soldOut || event.seatsLeft === 0 ? (
                <>
                  <Link href={link.href} className="btn btn-secondary">
                    Details
                  </Link>
                  <span className="text-[12px] font-semibold text-ink-3">Sold out</span>
                </>
              ) : (
                <>
                  <Link href={link.href} className="btn btn-primary">
                    Register
                  </Link>
                  {typeof event.seatsLeft === 'number' && (
                    <span
                      className={`text-[12px] font-semibold ${event.seatsLeft <= 3 ? 'text-amber' : 'text-ink-3'}`}
                    >
                      {event.seatsLeft} {event.seatsLeft === 1 ? 'seat' : 'seats'} left
                    </span>
                  )}
                </>
              )
            ) : event.href ? (
              <Link href={link.href} className="btn btn-secondary">
                Details
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
