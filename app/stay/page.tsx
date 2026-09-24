import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PhotoHero from '@/components/site/PhotoHero';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';

const BOOKING_URL = 'https://www.saltandcedarbedandbreakfast.com/';

export const metadata: Metadata = {
  title: 'Stay · Salt & Cedar Bed and Breakfast · Olympic Bluffs',
  description:
    'Salt & Cedar Bed and Breakfast sits on the high bluffs east of Port Angeles with 360-degree views of the Olympic Mountains and the Strait of Juan de Fuca, next door to the cidery and lavender farm.',
};

const MORNING = [
  {
    n: 'The view',
    title: 'Coffee over the Strait',
    text: 'Dungeness Spit to the east, Victoria across the water, the Olympics behind you. On a clear morning you can see all three from the porch.',
  },
  {
    n: 'The walk',
    title: 'Orchard and fields next door',
    text: 'The cider apple trees, the lavender rows, the grain and the apiary are a short walk from the door. Explore at your own pace.',
  },
  {
    n: 'The glass',
    title: 'Tasting room, Friday to Sunday',
    text: 'The cidery building opens Friday through Sunday afternoons. Walk over for a flight and a bottle to bring back.',
  },
];

export default function Stay() {
  return (
    <>
      <PhotoHero
        size="tall"
        image="/images/saltandcedar/building.jpeg"
        alt="Salt & Cedar Bed and Breakfast"
        kicker="Stay"
        title="Salt & Cedar Bed and Breakfast"
        text="A bed and breakfast on the high bluffs east of Port Angeles, with the Olympic Mountains on one side and the Strait of Juan de Fuca on the other."
        ctas={[
          { label: 'Book a stay', href: BOOKING_URL, external: true },
          { label: 'The farm', href: '/farm', variant: 'ghost' },
        ]}
      />

      <Section>
        <div className="max-w-[62ch]">
          <Eyebrow className="text-strait">The place</Eyebrow>
          <p className="mt-4 font-serif text-[clamp(22px,2.6vw,30px)] leading-snug">
            Nestled on the scenic high bluffs just east of Port Angeles, Washington, our bed and breakfast has
            360-degree views of the Olympic Mountain Range and the Strait of Juan de Fuca.
          </p>
          <p className="mt-5 leading-relaxed text-ink-2">
            Guests look out on the Dungeness Spit and Victoria, BC, from the comfort of our idyllic location. The
            house sits next to Olympic Bluffs Cidery & Lavender Farm, so you can explore the orchards and lavender
            fields at your leisure.
          </p>
        </div>
      </Section>

      <Section tone="strait" tight>
        <Eyebrow className="text-strait">What a morning looks like</Eyebrow>
        <SectionTitle className="mb-8 max-w-[22ch]">Wake up between the water and the mountains</SectionTitle>
        <ol className="grid gap-6 md:grid-cols-3 md:gap-8">
          {MORNING.map((item, i) => (
            <li key={item.n} className="border-t-2 border-strait pt-5">
              <p className="eyebrow text-strait">
                {String(i + 1).padStart(2, '0')} · {item.n}
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight">{item.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{item.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>A Pacific Northwest experience</Eyebrow>
            <SectionTitle className="max-w-[18ch]">Elopements and wedding events</SectionTitle>
          </div>
          <div className="space-y-5 leading-relaxed text-ink-2 lg:pt-8">
            <p>
              In collaboration with Goat & Radish Catering and Jean Lenke Music, as well as a network of skilled
              local wedding service providers, we are dedicated to making your special occasion unforgettable.
            </p>
            <p>
              Our complimentary wedding planning consultation and customizable wedding packages are designed to make
              sure your dream day is realized. A Salt & Cedar wedding experience package is waiting for you. Contact
              us for a tour and consultation.
            </p>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Contact us
            </a>
          </div>
        </div>
      </Section>

      <Section tone="dark" tight>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow className="text-white/70">Stay the weekend</Eyebrow>
            <SectionTitle size="sm" className="max-w-[28ch]">
              Book around the Lavender Festival, or come for a quiet weekend at the cidery
            </SectionTitle>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/events" className="btn btn-onphoto">
              Festival and events
            </Link>
            <Link href="/cider" className="btn btn-ghost">
              The cidery
            </Link>
          </div>
        </div>
      </Section>

      <div className="relative h-[60vh] min-h-[380px]">
        <Image
          src="/images/saltandcedar/chairs.jpg"
          alt="Two chairs looking out over the lavender fields"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
    </>
  );
}
