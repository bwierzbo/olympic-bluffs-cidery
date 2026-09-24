import type { Metadata } from 'next';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';
import EventCard from '@/components/site/EventCard';
import { getAllPastEvents, getAllUpcomingEvents } from '@/lib/events/listing';

// Events and seat counts come from the database; refreshed on every change
// (lib/events/revalidate.ts) and at least every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Events & classes · Olympic Bluffs Cidery & Lavender Farm',
  description:
    'The Lavender Festival, yoga in the fields, tastings and classes at Olympic Bluffs Cidery & Lavender Farm in Port Angeles, Washington.',
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([getAllUpcomingEvents(), getAllPastEvents()]);

  return (
    <>
      <Section>
        <Eyebrow>Events &amp; classes</Eyebrow>
        <SectionTitle as="h1" size="lg" className="max-w-[20ch]">
          Things to do on the farm this season
        </SectionTitle>

        {upcoming.length > 0 ? (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event, i) => (
              <li key={event.slug} className="flex">
                <EventCard event={event} priority={i === 0} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 max-w-[56ch] border-t border-line pt-6">
            <p className="font-serif text-xl italic text-ink-2">Nothing on the calendar right now.</p>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">
              New classes and tastings are announced in the newsletter first. Sign up at the foot of the page and
              we&rsquo;ll let you know.
            </p>
          </div>
        )}
      </Section>

      {past.length > 0 && (
        <Section tone="alt" tight>
          <Eyebrow>Earlier this season</Eyebrow>
          <SectionTitle size="sm">Already happened</SectionTitle>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <li key={event.slug} className="flex">
                <EventCard event={event} past />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
