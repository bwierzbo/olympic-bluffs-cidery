import Image from 'next/image';
import Link from 'next/link';
import { Cider, formatPrice, isCutout } from '@/lib/ciders';
import AddToCart from './AddToCart';

/**
 * A multipack (six-pack, mixed case) from VinoShipper, shown in the band
 * above the single-bottle list. Wider than a CiderCard: image left, contents
 * list right. Everything comes from the feed.
 */
export default function PackCard({ pack, buyable = true }: { pack: Cider; buyable?: boolean }) {
  const href = `/cider/${pack.slug}`;
  const opaque = !isCutout(pack.image);

  return (
    <article className="grid border border-line bg-paper sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Link href={href} className="relative block min-h-[260px] bg-amber-2/40" aria-label={pack.name}>
        <Image
          src={pack.image}
          alt={`${pack.name}`}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 40vw, 90vw"
          className={`object-contain p-6 ${opaque ? 'mix-blend-multiply' : 'drop-shadow-[0_16px_14px_rgba(0,0,0,0.18)]'}`}
        />
      </Link>
      <div className="flex flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow text-amber">{pack.unitDescription ?? 'Pack'}</p>
            <h3 className="mt-1 font-serif text-[26px] leading-none">
              <Link href={href} className="hover:text-ink-2">
                {pack.name}
              </Link>
            </h3>
          </div>
          <span className="pt-1 text-[17px] font-semibold tabular-nums">{formatPrice(pack.price)}</span>
        </div>
        {pack.description && <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{pack.description}</p>}
        {pack.packContents.length > 0 && (
          <ul className="mt-4 grid gap-1 text-[13.5px] text-ink-2 sm:grid-cols-2" aria-label="Contents">
            {pack.packContents.map((item) => (
              <li key={item.name} className="flex gap-2">
                <span className="tabular-nums text-ink-3">{item.qty} ×</span>
                <span>{item.name}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex-1" />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link href={href} className="text-sm font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline">
            Details
          </Link>
          {pack.soldOut ? (
            <span className="text-sm font-semibold text-ink-3">Sold out</span>
          ) : (
            <AddToCart productId={pack.vinoshipperId} enabled={buyable} quantity units="Packs" />
          )}
        </div>
      </div>
    </article>
  );
}
