import Image from 'next/image';
import Link from 'next/link';
import type { Maker } from '@/lib/content';

/** Brand accents used for portrait placeholders, cycled per card. */
export const PLACEHOLDER_COLORS = ['#a08a72', '#7f739a', '#5f7a87', '#b7752c', '#5e6b5a', '#8c5a4a'];

export function placeholderColor(index: number): string {
  return PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
}

/** Short chips for the card: where on the farm you find their work. */
export function whereChips(maker: Maker): string[] {
  const chips: string[] = [];
  if (maker.where.includes('boutique')) chips.push('Boutique');
  if (maker.where.includes('festival')) chips.push('Festival');
  if (maker.where.includes('collaborator')) chips.push('Partner');
  if (maker.featured) chips.push('Featured');
  return chips;
}

export function MakerPortrait({
  maker,
  color,
  sizes,
  className = '',
}: {
  maker: Maker;
  color: string;
  sizes: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: color }}>
      {maker.portrait ? (
        <Image
          src={maker.portrait}
          alt={maker.portraitAlt ?? maker.name}
          fill
          sizes={sizes}
          className="object-cover"
          style={maker.portraitPosition ? { objectPosition: maker.portraitPosition } : undefined}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <p className="font-serif text-lg italic text-white/85">Portrait to come</p>
        </div>
      )}
    </div>
  );
}

export default function MakerCard({ maker, index }: { maker: Maker; index: number }) {
  const chips = whereChips(maker);

  return (
    <Link
      href={`/makers/${maker.slug}`}
      className="group flex h-full flex-col border border-line bg-paper transition-colors hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
    >
      <MakerPortrait
        maker={maker}
        color={placeholderColor(index)}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="aspect-[4/5]"
      />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-[21px] leading-tight group-hover:underline underline-offset-4">{maker.name}</h3>
        <p className="mt-1 text-[13px] text-ink-2">
          {[maker.craft, maker.hometown].filter(Boolean).join(' · ')}
        </p>
        {(chips.length > 0 || maker.placeholder) && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Where to find them">
            {chips.map((chip) => (
              <li key={chip} className="chip px-2.5 py-0.5 text-[11px]">
                {chip}
              </li>
            ))}
            {maker.placeholder && (
              <li className="chip border-amber px-2.5 py-0.5 text-[11px] text-amber">Placeholder</li>
            )}
          </ul>
        )}
      </div>
    </Link>
  );
}
