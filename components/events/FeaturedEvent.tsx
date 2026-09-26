import Image from 'next/image';
import Link from 'next/link';
import { daysUntil, formatEventDate, type SiteEvent } from '@/lib/content';
import { getSiteConfig } from '@/lib/site-config';
import { SITE_URL } from '@/lib/site-url';

/**
 * Headline events (data/events.json entries with a `feature` block): the
 * homepage hero takeover, the wide banner on /events, and the event's own
 * page. Styled in the harvest palette (apple / apple-deep / cream) rather
 * than the everyday sage so it reads as an occasion.
 */

type Featured = SiteEvent & { feature: NonNullable<SiteEvent['feature']> };

export function isFeatured(event: SiteEvent | null | undefined): event is Featured {
  return Boolean(event?.feature);
}

function AppleMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 52" className={className} aria-hidden="true" fill="currentColor">
      <path d="M24 13.5c-3.2-2.4-7.4-3.3-11.1-1.9C6.1 14.2 3 21.2 4.4 29.4 6 38.9 12.4 49 19.5 49c1.9 0 3.1-.9 4.5-.9s2.6.9 4.5.9c7.1 0 13.5-10.1 15.1-19.6 1.4-8.2-1.7-15.2-8.5-17.8-3.7-1.4-7.9-.5-11.1 1.9Z" />
      <path d="M23 13c.4-4.6 2.3-8.4 5.6-10.9l1.8 1.8c-2.8 2.2-4.4 5.4-4.7 9.2Z" />
      <path d="M27.5 9.2c2.2-4.6 7.2-6.8 12.8-5.8-1.6 5.4-6.6 8.4-12.8 5.8Z" opacity=".75" />
    </svg>
  );
}

function address(): string {
  const { contact } = getSiteConfig();
  return `${contact.address1}, ${contact.city}, ${contact.state} ${contact.zip}`;
}

/** "Sunday, October 4" in farm time */
function longDate(iso: string): string {
  return formatEventDate(iso, { weekday: 'long', month: 'long' });
}

function googleCalendarUrl(event: SiteEvent): string {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.title} at Olympic Bluffs`,
    dates: `${stamp(event.startsAt)}/${stamp(event.endsAt)}`,
    details: `${event.summary}\n\n${SITE_URL}${event.href ?? '/events'}`,
    location: `Olympic Bluffs Cidery & Lavender Farm, ${address()}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** "Today", "Tomorrow", "In 8 days", "Happening now"; null once it has ended. */
function countdown(event: SiteEvent, now: Date = new Date()): string | null {
  const start = new Date(event.startsAt).getTime();
  const end = new Date(event.endsAt).getTime();
  if (now.getTime() >= end) return null;
  if (now.getTime() >= start) return 'Happening now';
  const days = daysUntil(event, now);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

/** The poster, tilted like it's pinned up, with a date sticker. */
function Flyer({ event, priority }: { event: Featured; priority?: boolean }) {
  if (!event.feature.flyer) return null;
  const day = formatEventDate(event.startsAt, { weekday: undefined, month: undefined });
  const month = formatEventDate(event.startsAt, { weekday: undefined, day: undefined });
  return (
    <div className="relative mx-auto w-full max-w-[400px] lg:max-w-[440px]">
      <div className="rotate-[2.5deg] bg-cream p-2.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,.55)] transition-transform duration-500 motion-safe:hover:rotate-0">
        <Image
          src={event.feature.flyer}
          alt={event.feature.flyerAlt ?? `${event.title} flyer`}
          width={1150}
          height={1367}
          priority={priority}
          sizes="(max-width: 1024px) 90vw, 440px"
          className="h-auto w-full"
        />
      </div>
      <div className="absolute -left-4 -top-5 flex h-[92px] w-[92px] -rotate-[10deg] flex-col items-center justify-center rounded-full bg-cream text-apple shadow-lg ring-4 ring-apple/15 sm:-left-8 sm:h-[104px] sm:w-[104px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em]">{month}</span>
        <span className="font-serif text-[40px] leading-none sm:text-[46px]">{day}</span>
      </div>
    </div>
  );
}

/**
 * Homepage hero while a headline event is coming up. Marked data-hero so the
 * header goes transparent over it, same as the photo hero it replaces.
 */
export function FeaturedEventHero({ event, variant = 'home' }: { event: Featured; variant?: 'home' | 'page' }) {
  const { feature } = event;
  const label = countdown(event);
  const pageHref = event.href ?? '/events';
  const ended = label === null;

  return (
    <section
      data-hero
      className="relative overflow-hidden bg-apple-deep text-cream"
      style={{
        backgroundImage:
          'radial-gradient(1200px 600px at 12% 0%, rgba(184,50,31,.95), transparent 60%), radial-gradient(900px 700px at 100% 100%, rgba(183,117,44,.45), transparent 60%)',
      }}
    >
      <AppleMark className="pointer-events-none absolute -right-24 -top-10 h-[560px] w-[520px] text-white/[0.04]" />

      <div className="container-x relative grid min-h-[78vh] items-center gap-12 pb-16 pt-28 sm:pt-32 lg:grid-cols-[1.1fr_.9fr] lg:gap-16 lg:pb-20">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {label && (
              <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-apple">
                <span className="h-2 w-2 rounded-full bg-apple motion-safe:animate-pulse" aria-hidden="true" />
                {label}
              </span>
            )}
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-cream/75">
              {feature.edition ? `${feature.edition} · ` : ''}Olympic Bluffs Cidery
            </span>
          </div>

          <h1
            className="mt-5 font-serif text-[clamp(60px,10vw,128px)] leading-[0.88] tracking-[-0.02em]"
            style={{ textShadow: '0 4px 40px rgba(0,0,0,.25)' }}
          >
            {event.title}
          </h1>
          <p className="mt-5 max-w-[26ch] font-serif text-[clamp(22px,2.6vw,30px)] italic leading-snug text-cream/95">
            {feature.tagline}
          </p>

          <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-8 gap-y-4 border-y border-cream/25 py-5 sm:grid-cols-3">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">When</dt>
              <dd className="mt-1 text-[15px] font-semibold">{longDate(event.startsAt)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">Time</dt>
              <dd className="mt-1 text-[15px] font-semibold">{event.timeLabel}</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">Where</dt>
              <dd className="mt-1 text-[15px] font-semibold">{getSiteConfig().contact.address1}</dd>
            </div>
          </dl>

          {ended ? (
            <p className="mt-7 max-w-[46ch] text-[16px] leading-relaxed text-cream/90">
              That’s a wrap for this year. Thank you to everyone who brought apples, and see you next fall.
            </p>
          ) : (
            <div className="mt-8 flex flex-wrap gap-3">
              {variant === 'home' ? (
                <Link href={pageHref} className="btn bg-cream px-6 py-3 text-apple-deep hover:bg-white">
                  See what’s happening
                </Link>
              ) : (
                <Link href="/visit" className="btn bg-cream px-6 py-3 text-apple-deep hover:bg-white">
                  Directions
                </Link>
              )}
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-cream/70 px-6 py-3 text-cream hover:bg-cream/10"
              >
                Add to calendar
              </a>
            </div>
          )}
        </div>

        <Flyer event={event} priority />
      </div>

      {/* Highlights ribbon */}
      <div className="relative border-t border-cream/20 bg-black/15">
        <ul className="container-x flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-cream/90 sm:justify-between">
          {feature.highlights.map((h, i) => (
            <li key={h.title} className="flex items-center gap-6">
              {i > 0 && <AppleMark className="hidden h-3.5 w-3.5 text-cream/50 sm:block" />}
              {h.title}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Wide banner at the top of /events for the headline event. */
export function FeaturedEventBanner({ event }: { event: Featured }) {
  const label = countdown(event);
  return (
    <Link
      href={event.href ?? '/events'}
      id={event.slug}
      className="group mt-10 grid scroll-mt-24 overflow-hidden bg-apple-deep text-cream sm:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
      style={{ backgroundImage: 'radial-gradient(700px 400px at 0% 0%, rgba(184,50,31,.95), transparent 70%)' }}
    >
      {event.feature.flyer && (
        <div className="relative aspect-[4/3] sm:aspect-auto">
          <Image
            src={event.feature.flyer}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 280px"
            className="object-cover object-[50%_40%]"
          />
        </div>
      )}
      <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          {label && (
            <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-apple">
              {label}
            </span>
          )}
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream/75">
            {event.feature.edition}
          </span>
        </div>
        <h2 className="font-serif text-[clamp(34px,5vw,56px)] leading-[0.95]">{event.title}</h2>
        <p className="text-[15px] font-semibold">
          {longDate(event.startsAt)} · {event.timeLabel}
        </p>
        <p className="max-w-[60ch] text-[15px] leading-relaxed text-cream/85">{event.summary}</p>
        <span className="mt-1 text-sm font-semibold underline underline-offset-4 group-hover:no-underline">
          Details and directions →
        </span>
      </div>
    </Link>
  );
}

/** The event's own page: hero, what's happening, the flyer and practical details. */
export function FeaturedEventPage({ event }: { event: Featured }) {
  const { feature } = event;
  return (
    <>
      <FeaturedEventHero event={event} variant="page" />

      <section className="bg-cream py-16 sm:py-20">
        <div className="container-x">
          <p className="eyebrow text-apple">What’s happening</p>
          <h2 className="mt-1.5 max-w-[22ch] font-serif text-[clamp(28px,4vw,44px)] leading-[1.05] text-apple-deep">
            An afternoon of pressing, music and fall on the farm
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {feature.highlights.map((h, i) => (
              <li key={h.title} className="border-t-4 border-apple bg-white/70 p-6">
                <p className="font-serif text-[40px] leading-none text-apple/80">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-3 font-serif text-2xl leading-tight text-apple-deep">{h.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{h.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-ground py-16 sm:py-20">
        <div className="container-x grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow">The details</p>
            <h2 className="mt-1.5 font-serif text-[clamp(28px,4vw,44px)] leading-[1.05]">Plan your afternoon</h2>
            <dl className="mt-8 divide-y divide-line border-y border-line text-[15px]">
              <div className="grid grid-cols-[110px_1fr] gap-4 py-4">
                <dt className="font-semibold">When</dt>
                <dd>
                  {longDate(event.startsAt)}, {event.timeLabel}
                </dd>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-4 py-4">
                <dt className="font-semibold">Where</dt>
                <dd>
                  {event.location}, Olympic Bluffs Cidery &amp; Lavender Farm
                  <br />
                  {address()}
                </dd>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-4 py-4">
                <dt className="font-semibold">Bring</dt>
                <dd>Apples, if you have them: to press for yourself or to donate to next year’s cider.</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/visit" className="btn btn-primary">
                Directions
              </Link>
              <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Google Calendar
              </a>
              <a href={`/api/events/${event.slug}/ics`} className="btn btn-secondary">
                Apple / Outlook calendar
              </a>
            </div>
          </div>

          {feature.flyer && (
            <figure>
              <Image
                src={feature.flyer}
                alt={feature.flyerAlt ?? `${event.title} flyer`}
                width={1150}
                height={1367}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full shadow-[0_20px_50px_-24px_rgba(0,0,0,.45)]"
              />
              <figcaption className="mt-3 text-[13px] text-ink-3">
                Share the flyer:{' '}
                <a href={feature.flyer} download className="underline underline-offset-4">
                  download it here
                </a>
                .
              </figcaption>
            </figure>
          )}
        </div>
      </section>
    </>
  );
}
