import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Section, SectionHeader } from '@/components/site/Section';
import CiderCard from '@/components/site/CiderCard';
import AddToCart from '@/components/site/AddToCart';
import VinoShipperLoader from '@/components/site/VinoShipperLoader';
import { getSiteConfig } from '@/lib/site-config';
import { getCider, getAllProducts, formatPrice, isCutout, type Cider } from '@/lib/ciders';

type Params = Promise<{ slug: string }>;

// Slugs come from VinoShipper product names. Anything not pre-rendered here
// is still served on demand.
export async function generateStaticParams() {
  try {
    return (await getAllProducts()).map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const cider = await getCider(slug).catch(() => undefined);
  if (!cider) return { title: 'Cider · Olympic Bluffs' };
  return {
    title: `${cider.name} · Olympic Bluffs Cider`,
    description: cider.description ?? `${cider.name}, an estate cider from Olympic Bluffs.`,
  };
}

/** Three other single bottles, in the feed's order (featured first). */
function siblingsOf(all: Cider[], slug: string) {
  return all.filter((c) => c.slug !== slug && !c.isPack).slice(0, 3);
}

export default async function CiderDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  let all: Cider[];
  try {
    all = await getAllProducts();
  } catch {
    return (
      <Section>
        <p className="font-serif text-2xl">The cider list is taking a moment.</p>
        <p className="mt-2 max-w-[50ch] text-ink-2">
          We could not reach our cider shop just now. Try again in a minute, or{' '}
          <Link href="/visit" className="underline underline-offset-4">
            visit the tasting room
          </Link>
          .
        </p>
      </Section>
    );
  }
  const cider = all.find((c) => c.slug === slug);
  if (!cider) notFound();
  const buyable = getSiteConfig().navigation.showCidery;

  const specs: Array<[string, string]> = [];
  if (cider.abv) specs.push(['ABV', cider.abv]);
  if (cider.isPack) {
    if (cider.unitDescription) specs.push(['Pack', cider.unitDescription]);
  } else {
    specs.push(['Bottle', cider.volume]);
  }
  if (cider.varietal && !cider.isPack) specs.push(['Fruit', cider.varietal]);
  if (cider.vintage) specs.push(['Vintage', cider.vintage]);
  specs.push(['Price', formatPrice(cider.price)]);
  specs.push(['Availability', cider.soldOut ? 'Sold out' : cider.almostSoldOut ? 'Almost sold out' : 'In stock']);

  const siblings = siblingsOf(all, cider.slug);

  return (
    <>
      <Section>
        <nav className="mb-8 text-sm text-ink-3" aria-label="Breadcrumb">
          <Link href="/cider" className="hover:text-ink">
            Cider
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink-2">{cider.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div
            className="relative aspect-[4/5] w-full lg:sticky lg:top-24"
            style={{ backgroundColor: `${cider.swatch}22` }}
          >
            <Image
              src={cider.image}
              alt={`${cider.name} bottle`}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className={`object-contain p-10 sm:p-14 ${
                isCutout(cider.image) ? 'drop-shadow-[0_24px_24px_rgba(0,0,0,0.2)]' : 'mix-blend-multiply'
              }`}
            />
          </div>

          <div>
            <p className="eyebrow text-amber">{cider.isPack ? cider.unitDescription ?? 'Pack' : 'Cider'}</p>
            <h1 className="mt-2 font-serif text-[clamp(36px,5vw,56px)] leading-[1]">{cider.name}</h1>
            {cider.awards.length > 0 && (
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber">{cider.awards.join(' · ')}</p>
            )}

            {cider.description ? (
              <p className="mt-6 text-[16px] leading-relaxed text-ink">{cider.description}</p>
            ) : (
              <p className="mt-6 text-[15px] italic text-ink-3">A description for this cider is on its way.</p>
            )}

            {cider.packContents.length > 0 && (
              <>
                <h2 className="mt-8 eyebrow">What’s in the pack</h2>
                <ul className="mt-3 grid gap-1.5 text-[15px] text-ink-2 sm:grid-cols-2">
                  {cider.packContents.map((item) => (
                    <li key={item.name} className="flex gap-2">
                      <span className="tabular-nums text-ink-3">{item.qty} ×</span>
                      <span>{item.name}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {cider.tastingNotes.length > 0 && (
              <>
                <h2 className="mt-8 eyebrow">Tasting notes</h2>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {cider.tastingNotes.map((note) => (
                    <li key={note} className="chip">
                      {note}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-3">
              {specs.map(([label, value]) => (
                <div key={label}>
                  <dt className="eyebrow">{label}</dt>
                  <dd className="mt-1 text-[15px]">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 border-t border-line pt-6">
              {buyable && <VinoShipperLoader />}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                {cider.soldOut ? (
                  <span className="btn btn-secondary cursor-default">Sold out</span>
                ) : (
                  <AddToCart productId={cider.vinoshipperId} enabled={buyable} quantity units={cider.isPack ? 'Packs' : 'Bottles'} />
                )}
                <Link href="/cider#ciders" className="text-sm font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                  All the ciders
                </Link>
              </div>
              <p className="mt-3 text-xs text-ink-3">
                Cider checks out through VinoShipper, our licensed carrier. Ships to select states; 21+.
                {cider.notAvailableIn.length > 0 && <> Not available in {cider.notAvailableIn.join(', ')}.</>}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {siblings.length > 0 && (
        <Section tone="alt">
          <SectionHeader eyebrow="Its siblings" title="More from the cidery" link={{ label: 'All the ciders', href: '/cider#ciders' }} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((s) => (
              <CiderCard key={s.slug} cider={s} buyable={buyable} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
