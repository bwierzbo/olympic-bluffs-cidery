import Image from 'next/image';
import Link from 'next/link';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';
import type { Maker } from '@/lib/content';

/** "In the boutique now", "Festival market, Saturday and Sunday", "Works with the farm". */
function whereLabels(maker: Maker): string[] {
  const labels: string[] = [];
  for (const where of maker.where) {
    if (where === 'boutique') labels.push('In the boutique now');
    if (where === 'festival') {
      labels.push(
        maker.festivalDays.length > 0 ? `Festival market, ${maker.festivalDays.join(' and ')}` : 'Festival market'
      );
    }
    if (where === 'collaborator') labels.push('Works with the farm');
  }
  return labels;
}

function currentMonth(): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'America/Los_Angeles' }).format(new Date());
}

/**
 * Homepage maker spotlight. Shows the maker flagged `featured` in
 * data/makers.json, so the owners can rotate it monthly without touching code.
 */
export default function MakerSpotlight({ maker }: { maker: Maker }) {
  const where = whereLabels(maker);

  return (
    <Section>
      <Eyebrow>Maker spotlight · {currentMonth()}</Eyebrow>
      <SectionTitle className="mb-8">The people who make things with us</SectionTitle>

      <article className="grid border border-line bg-paper md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[440px]">
          {maker.portrait ? (
            <Image
              src={maker.portrait}
              alt={maker.portraitAlt ?? `${maker.name}, ${maker.craftDetail.toLowerCase()}`}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
              style={maker.portraitPosition ? { objectPosition: maker.portraitPosition } : undefined}
            />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center bg-ground-2 p-6 text-center">
              <p className="font-serif text-lg italic text-ink-3">Portrait to come</p>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <Eyebrow>
            {[maker.craft, maker.hometown].filter(Boolean).join(' · ')}
          </Eyebrow>
          <h3 className="mt-1.5 font-serif text-[clamp(28px,3.6vw,40px)] leading-[1.05]">{maker.name}</h3>
          <p className="mt-2 font-serif text-lg italic text-ink-2">{maker.craftDetail}</p>
          <p className="mt-5 max-w-[56ch] leading-relaxed text-ink-2">{maker.bio}</p>

          {where.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Where to find them">
              {where.map((label) => (
                <li key={label} className="chip">
                  {label}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/makers/${maker.slug}`} className="btn btn-primary">
              Meet the maker
            </Link>
            <Link href="/makers" className="btn btn-secondary">
              All makers
            </Link>
          </div>
        </div>
      </article>
    </Section>
  );
}
