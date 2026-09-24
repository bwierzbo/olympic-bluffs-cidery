import Image from 'next/image';
import Link from 'next/link';
import { Section } from '@/components/site/Section';
import type { PublicEventDTO } from '@/lib/events/types';
import EventRegistration from './EventRegistration';
import { formatDollars, formatEventWhen, formatSeatsLeft } from './format';

export { formatEventWhen } from './format';

/**
 * A ticketed event's page: photo, facts and description on the left, the
 * registration card on the right (sticky on desktop, after the facts on
 * mobile).
 */
export default function EventDetail({ event }: { event: PublicEventDTO }) {
  const when = formatEventWhen(event.startsAt, event.endsAt);
  const paragraphs = event.description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const facts: Array<[string, string]> = [
    ['Date', when.date],
    ['Time', when.time],
    ['Where', event.location],
    ['Price', event.pricePerSeat > 0 ? `${formatDollars(event.pricePerSeat)} per person` : 'Free'],
  ];
  if (event.requires21) facts.push(['Ages', '21 and over']);
  if (event.registration !== 'cancelled') {
    facts.push(['Seats', formatSeatsLeft(event.seatsLeft, event.capacity)]);
  }

  return (
    <Section>
      <nav className="mb-8 text-sm text-ink-3" aria-label="Breadcrumb">
        <Link href="/events" className="hover:text-ink">
          Events
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-2">{event.title}</span>
      </nav>

      {/* One grid so the form mounts once: on mobile the registration card
          falls between the facts and the description; on desktop it is a
          sticky right column spanning both. */}
      <div className="grid gap-y-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:gap-x-16">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-ground-2">
            {event.image && (
              <Image
                src={event.image}
                alt={event.imageAlt || event.title}
                fill
                priority
                sizes="(min-width: 1024px) 60vw, 100vw"
                // Admin-entered https images may be on hosts next.config doesn't allow.
                // Uploaded photos (Vercel Blob) go through the optimizer; other remote URLs load as-is.
                unoptimized={/^https?:\/\//.test(event.image) && !event.image.includes('.public.blob.vercel-storage.com')}
                className="object-cover"
              />
            )}
          </div>

          {event.registration === 'cancelled' && <p className="eyebrow mt-8 text-amber">Cancelled</p>}
          <h1
            className={`font-serif text-[clamp(34px,5vw,52px)] leading-[1.05] ${
              event.registration === 'cancelled' ? 'mt-2' : 'mt-8'
            }`}
          >
            {event.title}
          </h1>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="eyebrow">{label}</dt>
                <dd
                  className={`mt-1 text-[15px] ${
                    label === 'Seats' && event.seatsLeft > 0 && event.seatsLeft <= 3 ? 'text-amber' : ''
                  }`}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <aside aria-label="Registration" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="border border-line bg-paper p-5 sm:p-6 lg:sticky lg:top-24">
            <EventRegistration event={event} />
          </div>
        </aside>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2">
          {paragraphs.length > 0 && (
            <div className="max-w-[62ch] space-y-4 text-[16px] leading-relaxed text-ink">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
          )}

          {event.refundPolicy && (
            <div className="mt-8 max-w-[62ch] border-t border-line pt-5">
              <h2 className="eyebrow">Refunds</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{event.refundPolicy}</p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
