import type { Metadata } from 'next';
import Link from 'next/link';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';
import { getSiteConfig } from '@/lib/site-config';
import { getHoursConfig, getTodayHours, getWeekSummary, getWeeklyHours } from '@/lib/hours';
import { eventLink, formatEventDateRange } from '@/lib/content';
import { getAllUpcomingEvents } from '@/lib/events/listing';

// Events and seat counts come from the database; refreshed on every change
// (lib/events/revalidate.ts) and at least every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Plan your visit · Olympic Bluffs Cidery & Lavender Farm',
  description:
    'Hours, directions and what to expect at Olympic Bluffs Cidery & Lavender Farm in Port Angeles, Washington. Free to enter, dogs on leash.',
};

const MAP_EMBED_SRC =
  'https://maps.google.com/maps?q=1025+Finn+Hall+Road,+Port+Angeles,+WA+98362&t=&z=13&ie=UTF8&iwloc=&output=embed';

/** Questions a first-time visitor asks. Answers are kept word for word from the old Farm page FAQ. */
const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: 'Is the cidery currently open?',
    answer: 'Yes! The cidery is open Friday - Sunday, 12 - 5 pm starting April 24th.',
  },
  {
    question: 'Are dogs allowed on the farm?',
    answer: "Leashed dogs are welcome! We just ask that you clean up after them and respect other guest's space.",
  },
  {
    question: 'Does it cost anything to enter the farm?',
    answer: 'The farm is free to enter!',
  },
  {
    question: 'Is the farm wheelchair friendly?',
    answer: 'Our fields and pathways are generally flat with some uneven ground.',
  },
  {
    question: 'Is the farm open all year?',
    answer:
      'For 2026, the farm, gift shop, and cidery open April 24th. Friday - Sunday: 12 - 5 pm. Extended hours during Lavender Festival Weekend (July 17-20): 10 am - 5 pm.',
  },
  {
    question: 'Do you ship cider to my state?',
    answer: 'Cider ships through VinoShipper to select states; the list is on the cider page.',
  },
];

/** "2026-04-24" -> "April 24" (parsed as a plain date, so no time zone drift). */
function formatSeasonDate(iso: string | undefined, month: 'long' | 'short' = 'long'): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Intl.DateTimeFormat('en-US', { month, day: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

/** "Friday–Sunday, 12–5 pm" -> "Friday to Sunday" for the headline. */
function openDaysPhrase(summary: string): string {
  const days = summary.split(',')[0].trim();
  return days.includes('–') ? days.replace('–', ' to ') : days;
}

export default async function VisitPage() {
  const config = getSiteConfig();
  const { contact, events } = config;
  const hours = getHoursConfig();
  const today = getTodayHours();
  const weekly = getWeeklyHours();
  const weekSummary = getWeekSummary();
  const seasonOpens = formatSeasonDate(hours.seasonStart);
  const seasonOpensShort = formatSeasonDate(hours.seasonStart, 'short');
  const seasonCloses = formatSeasonDate(hours.seasonEnd);
  const allUpcoming = await getAllUpcomingEvents();
  const upcoming = allUpcoming.slice(0, 3);
  const festival = allUpcoming.find((e) => e.kind === 'festival');
  const telHref = `tel:${contact.phone.replace(/\D/g, '')}`;

  const seasonTiles = [
    {
      month: 'April',
      text: `${seasonOpensShort ? `Farm opens ${seasonOpensShort}.` : 'Farm opens for the season.'} First pours of the year.`,
      tone: '',
    },
    { month: 'May', text: 'Orchard in blossom. Bees out.', tone: '' },
    { month: 'June', text: 'Early lavender. Fields turning purple.', tone: 'bg-lav-2 border-lav' },
    {
      month: 'July',
      text: `Peak bloom. Lavender Festival, ${events.dates}.`,
      tone: 'bg-lav-2 border-lav',
    },
    { month: 'August', text: 'Harvest and distilling. Last of the bloom.', tone: 'bg-lav-2 border-lav' },
    { month: 'Sept–Oct', text: 'Apple harvest and press. New-season cider.', tone: 'bg-amber-2 border-amber' },
  ];

  return (
    <>
      <Section>
        <Eyebrow>Plan your visit</Eyebrow>
        <SectionTitle as="h1" size="lg" className="max-w-[24ch]">
          Free to enter, dogs on leash, tasting room open {openDaysPhrase(weekSummary)}
        </SectionTitle>

        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Hours and FAQ */}
          <div>
            <Eyebrow className="mb-3">
              Hours
              {seasonOpens && seasonCloses
                ? ` · ${seasonOpens} to ${seasonCloses}`
                : seasonOpens
                  ? ` · season opens ${seasonOpens}`
                  : ''}
            </Eyebrow>
            <table className="w-full border-t border-line text-[15px]">
              <caption className="sr-only">Weekly hours</caption>
              <tbody>
                {weekly.map((row) => {
                  const isToday = today.inSeason && row.open && row.key === today.dayKey;
                  return (
                    <tr key={row.key} className={`border-b border-line ${isToday ? 'font-semibold' : ''}`}>
                      <th scope="row" className="py-2.5 text-left font-normal">
                        <span className={isToday ? 'font-semibold' : ''}>{row.day}</span>
                        {isToday && (
                          <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-ground-2 px-2 py-0.5 text-[11px] font-semibold text-sage">
                            <span className="h-1.5 w-1.5 rounded-full bg-sage" aria-hidden="true" />
                            Open today
                          </span>
                        )}
                      </th>
                      <td className={`py-2.5 text-right tabular-nums ${row.open ? '' : 'text-ink-3'}`}>
                        {row.label}
                      </td>
                    </tr>
                  );
                })}
                {festival && (
                  <tr className="border-b border-line">
                    <th scope="row" className="py-2.5 text-left font-normal text-lav">
                      Lavender Festival weekend, {formatEventDateRange(festival)}
                    </th>
                    <td className="py-2.5 text-right tabular-nums">{festival.timeLabel.replace(/ each day$/, '')}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {hours.note && <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">{hours.note}</p>}

            <Eyebrow className="mb-2 mt-10">Good to know</Eyebrow>
            <div className="border-t border-line">
              {FAQS.map((faq) => (
                <details key={faq.question} className="group border-b border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 font-serif text-[19px] leading-snug marker:content-none [&::-webkit-details-marker]:hidden">
                    <span>{faq.question}</span>
                    <span
                      className="shrink-0 text-2xl font-light leading-none text-ink-3 transition-transform group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="pb-4 text-[15px] leading-relaxed text-ink-2">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Map and directions */}
          <div>
            <Eyebrow className="mb-3">Getting here</Eyebrow>
            <div className="aspect-[4/3] w-full bg-strait-2">
              <iframe
                src={MAP_EMBED_SRC}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Map to Olympic Bluffs Cidery & Lavender Farm"
              />
            </div>
            <address className="mt-4 text-[15px] not-italic leading-relaxed">
              <span className="font-semibold">{contact.address1}</span>
              <br />
              {contact.city}, {contact.state} {contact.zip}
            </address>
            {/* Drive times from routing between the farm and each place (Sept 2026). */}
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">
              About 20 minutes east of downtown Port Angeles and the Coho ferry to Victoria, 15 minutes west of Sequim,
              and 1 hour 25 minutes from the Kingston ferry to Seattle. Gravel lot, room for RVs.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Open in Maps
              </a>
              <a href={telHref} className="btn btn-secondary">
                Call
              </a>
            </div>
          </div>
        </div>

        {/* Season strip */}
        <div id="season" className="mt-16 scroll-mt-24">
          <Eyebrow className="mb-4">What you&rsquo;ll find, month by month</Eyebrow>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {seasonTiles.map((tile) => (
              <li
                key={tile.month}
                className={`border p-4 ${tile.tone || 'border-line bg-paper'}`}
              >
                <p className="font-serif text-xl leading-tight">{tile.month}</p>
                <p className="mt-2 text-[13.5px] leading-snug text-ink-2">{tile.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Upcoming events */}
      <Section tone="alt" tight>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Coming up</Eyebrow>
            <SectionTitle size="sm">On the calendar</SectionTitle>
          </div>
          <Link href="/events" className="btn btn-secondary">
            All events
          </Link>
        </div>
        {upcoming.length > 0 ? (
          <ul className="mt-6 border-t border-line">
            {upcoming.map((event) => {
              const link = eventLink(event);
              const inner = (
                <>
                  <span className="font-serif text-lg">{event.title}</span>
                  <span className="tabular-nums text-ink-2">{formatEventDateRange(event)}</span>
                </>
              );
              const cls =
                'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3.5 hover:underline underline-offset-4';
              return (
                <li key={event.slug} className="border-b border-line">
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                      {inner}
                    </a>
                  ) : (
                    <Link href={link.href} className={cls}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-6 text-ink-2">Nothing on the calendar yet. Check back soon.</p>
        )}
      </Section>

      {/* Contact */}
      <Section id="contact" tight className="scroll-mt-24">
        <Eyebrow>Contact</Eyebrow>
        <SectionTitle size="sm">Get in touch</SectionTitle>
        <div className="mt-6 grid gap-8 text-[15px] leading-relaxed sm:grid-cols-3">
          <div>
            <p className="eyebrow mb-1">Phone</p>
            <a href={telHref} className="hover:underline underline-offset-4">
              {contact.phone}
            </a>
          </div>
          <div>
            <p className="eyebrow mb-1">Email</p>
            <a href={`mailto:${contact.email}`} className="hover:underline underline-offset-4">
              {contact.email}
            </a>
          </div>
          <div>
            <p className="eyebrow mb-1">Follow</p>
            <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">
              Instagram
            </a>
            <br />
            <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4">
              Facebook
            </a>
          </div>
        </div>
        <p className="mt-6 max-w-[56ch] text-[13.5px] text-ink-2">
          Groups of ten or more, please give us a day&rsquo;s notice.
        </p>
      </Section>
    </>
  );
}
