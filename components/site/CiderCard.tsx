import Image from 'next/image';
import Link from 'next/link';
import { Cider, formatPrice, isCutout } from '@/lib/ciders';
import AddToCart from './AddToCart';

/**
 * One cider in the list. Everything shown here comes from VinoShipper
 * (name, price, ABV, description, tasting notes, awards, stock); only the
 * swatch color and the optional local bottle render are ours. The Add to
 * Cart control is VinoShipper's, so each cider is listed exactly once.
 */
export default function CiderCard({
  cider,
  priority = false,
  buyable = true,
}: {
  cider: Cider;
  priority?: boolean;
  /** false when online cider sales are switched off in site-config */
  buyable?: boolean;
}) {
  const specs = [cider.abv, cider.volume, cider.varietal && cider.varietal !== 'Apple' ? cider.varietal : null].filter(Boolean);
  const href = `/cider/${cider.slug}`;
  const opaque = !isCutout(cider.image);

  return (
    <article className="flex flex-col border border-line bg-paper">
      <div className="h-1.5 w-full" style={{ backgroundColor: cider.swatch }} aria-hidden="true" />
      <div className="flex flex-1 flex-col p-5">
        <Link href={href} className="relative mb-4 block h-[230px]" aria-label={cider.name}>
          <Image
            src={cider.image}
            alt={`${cider.name} bottle`}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className={`object-contain object-bottom transition-transform duration-300 hover:-translate-y-1 ${
              opaque ? 'mix-blend-multiply' : 'drop-shadow-[0_16px_14px_rgba(0,0,0,0.18)]'
            }`}
          />
        </Link>

        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-2xl leading-none">
            <Link href={href} className="hover:text-ink-2">
              {cider.name}
            </Link>
          </h3>
          <span className="pt-1 text-[15px] font-semibold tabular-nums">{formatPrice(cider.price)}</span>
        </div>
        {specs.length > 0 && <p className="mt-2 text-xs text-ink-3">{specs.join(' · ')}</p>}
        {cider.awards.length > 0 && (
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber">{cider.awards.join(' · ')}</p>
        )}
        {cider.description && <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">{cider.description}</p>}
        {cider.tastingNotes.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Tasting notes">
            {cider.tastingNotes.map((note) => (
              <li key={note} className="chip">
                {note}
              </li>
            ))}
          </ul>
        )}
        <div className="flex-1" />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link href={href} className="text-sm font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline">
            Details
          </Link>
          {cider.soldOut ? (
            <span className="text-sm font-semibold text-ink-3">Sold out</span>
          ) : (
            /* Quantity lives here: VinoShipper's cart drawer only offers Remove. */
            <AddToCart productId={cider.vinoshipperId} enabled={buyable} quantity />
          )}
        </div>
      </div>
    </article>
  );
}
