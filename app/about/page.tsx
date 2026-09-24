import type { Metadata } from 'next';
import Link from 'next/link';
import PhotoHero from '@/components/site/PhotoHero';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';

export const metadata: Metadata = {
  title: 'About · Olympic Bluffs Cidery & Lavender Farm',
  description:
    'Scott and Ginger, two Air Force veterans who came to the Olympic Peninsula for the 2015 lavender festival and stayed to plant an orchard, a lavender farm, an apiary and an acre of ancient grain.',
};

const NUMBERS = [
  { value: '21', label: 'acres on the bluffs' },
  { value: '480', label: 'semi-dwarf cider apple trees' },
  { value: '3,400', label: 'lavender plants' },
  { value: '1', label: 'acre of ancient grains with the WSU Breadlab' },
  { value: 'Italian', label: 'honeybees in the apiary' },
  { value: 'Nov 2024', label: 'Salt & Cedar Bed and Breakfast opened' },
];

export default function About() {
  return (
    <>
      <PhotoHero
        size="short"
        image="/images/team/aboutus.jpeg"
        alt="Scott and Ginger"
        kicker="About"
        title="Scott and Ginger"
        position="center 30%"
      />

      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-20">
          <div className="max-w-[62ch] space-y-5 text-[17px] leading-relaxed text-ink-2">
            <p className="font-serif text-2xl italic leading-snug text-ink">Between the Strait and the Olympics.</p>
            <p>
              In 2015 we visited the Olympic Peninsula for the first time during the annual lavender festival and
              immediately fell in love with the beauty of the land and the spirit of the community. In 2020 we made
              the peninsula our full-time home.
            </p>
            <p>
              We are both US Air Force veterans and have been stationed all around the world. Each new assignment
              brought new experiences and new people. We learned quickly, making new friends and building
              relationships in small communities.
            </p>
            <p>
              With the goal of creating great cider and the desire to bring our community together, we decided to
              start a hard cidery and lavender farm. We have planted an orchard of 480 semi-dwarf cider apple trees,
              3,400 lavender plants, an apiary and an acre of ancient grains, wheat and rye. In November 2024 we
              added Salt and Cedar Bed and Breakfast.
            </p>
            <p>We’re excited about being a part of the community and sharing this beautiful destination with you.</p>
          </div>

          <aside className="border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <Eyebrow>By the numbers</Eyebrow>
            <dl className="mt-4 divide-y divide-line">
              {NUMBERS.map((item) => (
                <div key={item.label} className="flex items-baseline gap-4 py-3.5">
                  <dt className="w-[5.5ch] shrink-0 font-serif text-2xl leading-none text-ink">{item.value}</dt>
                  <dd className="text-sm leading-snug text-ink-2">{item.label}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </Section>

      <Section tone="dark" tight>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow className="text-white/70">Keep going</Eyebrow>
            <SectionTitle size="sm" className="max-w-[24ch]">
              See the fields for yourself
            </SectionTitle>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/farm" className="btn btn-onphoto">
              Walk the farm
            </Link>
            <Link href="/visit" className="btn btn-ghost">
              Plan a visit
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
