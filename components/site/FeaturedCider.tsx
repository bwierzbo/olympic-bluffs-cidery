import Image from 'next/image';
import Link from 'next/link';
import { Eyebrow, Section } from '@/components/site/Section';
import { formatPrice, isCutout, type Cider } from '@/lib/ciders';

/**
 * "Now pouring" band for the homepage: the featured cider's bottle on an
 * amber ground with its description, tasting notes and specs. All content
 * comes from VinoShipper; which cider is featured is set in data/ciders.json.
 */
export default function FeaturedCider({ cider }: { cider: Cider }) {
  const specs: { label: string; value: string }[] = [];
  if (cider.abv) specs.push({ label: 'ABV', value: cider.abv });
  specs.push({ label: 'Bottle', value: cider.volume.replace(/(\d)(mL)$/i, '$1 ml') });
  specs.push({ label: 'Orchard', value: 'Olympic Bluffs estate' });
  specs.push({ label: 'Price', value: formatPrice(cider.price) });

  return (
    <Section tone="amber">
      <div className="grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[380px] md:max-w-none">
          <Image
            src={cider.image}
            alt={`${cider.name} bottle`}
            fill
            sizes="(max-width: 768px) 80vw, 40vw"
            className={`object-contain ${
              isCutout(cider.image) ? 'drop-shadow-[0_28px_36px_rgba(60,35,10,0.22)]' : 'mix-blend-multiply'
            }`}
          />
        </div>
        <div>
          <Eyebrow className="text-amber">Now pouring</Eyebrow>
          <h2 className="mt-1.5 font-serif text-[clamp(38px,5.5vw,64px)] leading-[1]">{cider.name}</h2>
          {cider.awards.length > 0 && (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber">{cider.awards.join(' · ')}</p>
          )}
          {cider.description && <p className="mt-5 max-w-[56ch] leading-relaxed text-ink-2">{cider.description}</p>}

          {cider.tastingNotes.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tasting notes">
              {cider.tastingNotes.map((note) => (
                <li key={note} className="chip border-amber/40 bg-paper/60 text-ink">
                  {note}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ink/15 pt-5 text-sm sm:grid-cols-4">
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt className="eyebrow text-ink-3">{spec.label}</dt>
                <dd className="mt-1 font-medium text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/cider/${cider.slug}`} className="btn btn-primary">
              {cider.soldOut ? 'About this cider' : 'Shop this cider'}
            </Link>
            <Link href="/cider" className="btn btn-secondary">
              All ciders
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
