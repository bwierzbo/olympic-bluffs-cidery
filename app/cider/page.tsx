import type { Metadata } from 'next';
import Link from 'next/link';
import PhotoHero from '@/components/site/PhotoHero';
import { Section, Eyebrow, SectionTitle } from '@/components/site/Section';
import CiderList from '@/components/site/CiderList';
import PackCard from '@/components/site/PackCard';
import NewsletterForm from '@/components/site/NewsletterForm';
import { getCiderCatalog, type Cider } from '@/lib/ciders';
import { getSiteConfig } from '@/lib/site-config';
import { getWeekSummary } from '@/lib/hours';
import VinoShipperLoader from '@/components/site/VinoShipperLoader';

// While online cider ordering is switched off in site-config, keep the page
// out of search results. The editorial content still renders; only the
// VinoShipper buy step is gated.
export async function generateMetadata(): Promise<Metadata> {
  const showCidery = getSiteConfig().navigation.showCidery;
  return {
    title: 'Cider · Olympic Bluffs',
    description:
      'Estate ciders from bittersweet and heirloom apples grown on a bluff over the Strait of Juan de Fuca, plus botanical blends with our own lavender, black currant and salal.',
    robots: showCidery ? undefined : { index: false, follow: false },
  };
}

const PROCESS = [
  {
    n: '1 · Grow',
    title: 'The orchard',
    text: 'Semi-dwarf trees of Kingston Black, Stoke Red, Ashmead’s Kernel, Northern Spy and Somerset varieties, planted for tannin and acid.',
  },
  {
    n: '2 · Press',
    title: 'Harvest and press',
    text: 'Picked in October, sweated, milled and pressed on site within the week.',
  },
  {
    n: '3 · Ferment',
    title: 'Slow and cool',
    text: 'Small tanks, long ferments in the maritime cold. Some batches age in bourbon barrels.',
  },
  {
    n: '4 · Blend',
    title: 'Farm botanicals',
    text: 'Lavender, black currant, salal, quince and ginger from the farm and its neighbors go into the flavored releases.',
  },
];

export default async function CiderPage() {
  const showCidery = getSiteConfig().navigation.showCidery;
  let ciders: Cider[] = [];
  let packs: Cider[] = [];
  let shipsTo: string[] = [];
  let feedError = false;
  try {
    const catalog = await getCiderCatalog();
    ciders = catalog.ciders;
    packs = catalog.packs;
    shipsTo = catalog.shipsTo;
  } catch (error) {
    console.error('VinoShipper feed unavailable:', error);
    feedError = true;
  }
  const weekSummary = getWeekSummary();

  return (
    <>
      <PhotoHero
        size="tall"
        image="/images/farm/orchard.jpeg"
        alt="The orchard at Olympic Bluffs"
        kicker="Cider"
        title="Pressed from 480 trees on a bluff over the Strait."
        text="Estate ciders from bittersweet and heirloom apples, plus a few we blend with our own lavender, black currant and salal."
        ctas={[
          { label: 'See the ciders', href: '#ciders', variant: 'onphoto' },
          { label: 'Tasting room hours', href: '/visit', variant: 'ghost' },
        ]}
      />

      <Section tone="dark">
        <Eyebrow className="text-white/70">Orchard to bottle</Eyebrow>
        <SectionTitle className="max-w-[22ch]">How a cider gets made here</SectionTitle>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((step) => (
            <div key={step.n}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#dcb27d]">{step.n}</p>
              <h3 className="mt-2 font-serif text-xl">{step.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/80">{step.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {packs.length > 0 && (
        <Section tone="amber" tight id="packs" className="scroll-mt-16">
          {showCidery && <VinoShipperLoader />}
          <div className="mb-8">
            <Eyebrow className="text-amber">Packs</Eyebrow>
            <SectionTitle className="max-w-[22ch]">Six-packs and mixed cases</SectionTitle>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {packs.map((pack) => (
              <PackCard key={pack.slug} pack={pack} buyable={showCidery} />
            ))}
          </div>
        </Section>
      )}

      <Section id="ciders" className="scroll-mt-16">
        {showCidery && packs.length === 0 && <VinoShipperLoader />}
        {feedError ? (
          <div className="border border-line bg-paper p-6 text-[15px] text-ink-2">
            The cider list is taking a moment. We could not reach our cider shop just now; try again in a minute, or{' '}
            <Link href="/visit" className="font-semibold text-ink underline underline-offset-4">
              visit the tasting room
            </Link>
            .
          </div>
        ) : (
          <CiderList ciders={ciders} buyable={showCidery} />
        )}
        <p className="mt-8 max-w-[70ch] text-[13px] text-ink-3">
          {showCidery ? (
            <>
              Cider checks out through VinoShipper, our licensed carrier, separately from the lavender shop. Pickup
              at the farm or shipping to {shipsTo.length > 0 ? `${shipsTo.length} states (${shipsTo.join(', ')})` : 'select states'}; 21+.
            </>
          ) : (
            <>
              Online ordering is coming soon. Until then, every cider on this page is poured and sold in the tasting
              room.{' '}
              <Link href="/visit" className="font-semibold text-ink underline underline-offset-4">
                Plan a visit
              </Link>
              .
            </>
          )}
        </p>
      </Section>

      <section className="bg-ink py-16 text-white sm:py-20">
        <div className="container-x grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow text-white/70">New releases</p>
            <h2 className="mt-1.5 font-serif text-[clamp(28px,4vw,44px)] leading-[1.05]">
              Be first to hear about new releases
            </h2>
            <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-white/80">
              A few notes a year when something new comes out of tank or barrel. No more than that.
            </p>
            <div className="mt-6 max-w-md">
              <NewsletterForm source="cider" />
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 md:border-l md:border-t-0 md:pl-10 md:pt-0">
            <p className="eyebrow text-white/70">Tasting room</p>
            <p className="mt-2 font-serif text-2xl">{weekSummary}</p>
            <p className="mt-2 max-w-[40ch] text-[15px] leading-relaxed text-white/80">
              Taste through the current releases by the flight or the glass, then take bottles home from the farm.
            </p>
            <Link href="/visit" className="btn btn-ghost mt-5">
              Plan a visit
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
