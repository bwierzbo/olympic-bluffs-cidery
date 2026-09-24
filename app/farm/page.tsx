import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PhotoHero from '@/components/site/PhotoHero';
import { Eyebrow } from '@/components/site/Section';
import FarmMedia from '@/components/FarmMedia';
import { getFarmStops } from '@/lib/content';

export const metadata: Metadata = {
  title: 'The farm · Olympic Bluffs Cidery & Lavender Farm',
  description:
    'A walk around twenty-one acres on the bluffs above the Strait of Juan de Fuca: the apiary, the orchard, the lavender fields, the cidery and more.',
};

/** Stops that have a page of their own get a link under the paragraph. */
const STOP_LINKS: Record<string, { href: string; label: string }> = {
  stay: { href: '/stay', label: 'Stay at Salt & Cedar' },
  cidery: { href: '/cider', label: 'See the ciders' },
  boutique: { href: '/lavender', label: 'Shop the boutique' },
};

export default function FarmPage() {
  const stops = getFarmStops();

  return (
    <>
      <PhotoHero
        size="tall"
        image="/images/farm/lavender-banner.jpg"
        alt="Rows of lavender on the farm with the Olympic Mountains behind"
        kicker="The farm"
        title="A walk around twenty-one acres"
        text={`${stops.length === 8 ? 'Eight' : stops.length} stops, in the order you meet them from the gate.`}
      />

      <section className="bg-ground py-6 sm:py-10">
        <ol className="container-x">
          {stops.map((stop, i) => {
            const flip = i % 2 === 1;
            const link = STOP_LINKS[stop.slug];
            return (
              <li
                key={stop.slug}
                className="grid items-center gap-6 border-b border-line py-10 last:border-b-0 sm:py-12 md:grid-cols-2 md:gap-12"
              >
                <div className={`relative aspect-[16/10] overflow-hidden bg-ground-2 ${flip ? 'md:order-2' : ''}`}>
                  <Image
                    src={stop.image}
                    alt={stop.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className={flip ? 'md:order-1' : ''}>
                  <Eyebrow>
                    Stop {i + 1} of {stops.length}
                  </Eyebrow>
                  <h2 className="mt-1.5 font-serif text-[clamp(28px,3.6vw,40px)] leading-[1.05]">{stop.title}</h2>
                  <p className="mt-4 max-w-[56ch] leading-relaxed text-ink-2">{stop.description}</p>
                  {link && (
                    <Link href={link.href} className="btn btn-secondary mt-6">
                      {link.label}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <FarmMedia />
    </>
  );
}
