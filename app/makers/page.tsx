import type { Metadata } from 'next';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';
import MakerFilters from '@/components/site/MakerFilters';
import { getMakers } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Makers · Olympic Bluffs Cidery & Lavender Farm',
  description:
    'The artists, growers and neighbors whose work is sold in the lavender boutique, at the Lavender Festival market, or who partner with the farm on events, weddings and grain.',
};

export default function MakersPage() {
  const makers = getMakers();

  return (
    <Section>
      <Eyebrow>Makers</Eyebrow>
      <SectionTitle as="h1" size="lg" className="max-w-[20ch]">
        The artists, growers and neighbors who make things with us
      </SectionTitle>
      <p className="mt-5 max-w-[56ch] leading-relaxed text-ink-2">
        Some sell in the boutique all season. Some come for the Lavender Festival market. Others partner with us on
        events, weddings and the grain we grow. Here is who they are and where to find their work.
      </p>

      <MakerFilters makers={makers} />
    </Section>
  );
}
