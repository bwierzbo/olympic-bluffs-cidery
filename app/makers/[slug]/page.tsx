import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Eyebrow, Section } from '@/components/site/Section';
import { MakerPortrait, placeholderColor } from '@/components/site/MakerCard';
import { getMaker, getMakers } from '@/lib/content';

interface MakerPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getMakers().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: MakerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const maker = getMaker(slug);
  if (!maker) return {};
  return {
    title: `${maker.name} · Makers · Olympic Bluffs Cidery & Lavender Farm`,
    description: `${maker.craftDetail}. ${maker.craft}${maker.hometown ? ` from ${maker.hometown}` : ''}.`,
  };
}

function instagramHandle(url: string): string {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '');
    const handle = path.split('/').filter(Boolean).pop();
    return handle ? `@${handle}` : 'Instagram';
  } catch {
    return 'Instagram';
  }
}

function websiteLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Website';
  }
}

export default async function MakerPage({ params }: MakerPageProps) {
  const { slug } = await params;
  const makers = getMakers();
  const index = makers.findIndex((m) => m.slug === slug);
  const maker = index >= 0 ? makers[index] : undefined;
  if (!maker) notFound();

  const where: string[] = [];
  if (maker.where.includes('boutique')) where.push('In the boutique now');
  if (maker.where.includes('festival')) {
    where.push(
      maker.festivalDays.length > 0 ? `Festival market · ${maker.festivalDays.join(' & ')}` : 'Festival market'
    );
  }
  if (maker.where.includes('collaborator')) where.push('Works with the farm');

  return (
    <Section>
      <Link href="/makers" className="text-[13px] text-ink-2 underline-offset-4 hover:underline">
        &larr; All makers
      </Link>

      <article className="mt-6 grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
        <MakerPortrait
          maker={maker}
          color={placeholderColor(index)}
          sizes="(max-width: 768px) 100vw, 40vw"
          className="aspect-[4/5]"
        />

        <div>
          <Eyebrow>
            {[maker.craft, maker.hometown].filter(Boolean).join(' · ')}
          </Eyebrow>
          <h1 className="mt-1.5 font-serif text-[clamp(32px,4.5vw,52px)] leading-[1.05]">{maker.name}</h1>
          <p className="mt-2 font-serif text-xl italic text-ink-2">{maker.craftDetail}</p>
          <p className="mt-6 max-w-[56ch] leading-relaxed text-ink-2">{maker.bio}</p>

          {(where.length > 0 || maker.placeholder) && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Where to find their work">
              {where.map((label) => (
                <li key={label} className="chip">
                  {label}
                </li>
              ))}
              {maker.placeholder && <li className="chip border-amber text-amber">Placeholder</li>}
            </ul>
          )}

          {(maker.website || maker.instagram) && (
            <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[14px]">
              {maker.website && (
                <a
                  href={maker.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-ink-2"
                >
                  {websiteLabel(maker.website)}
                </a>
              )}
              {maker.instagram && (
                <a
                  href={maker.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-ink-2"
                >
                  {instagramHandle(maker.instagram)}
                </a>
              )}
            </p>
          )}

          {maker.productIds.length > 0 && (
            <p className="mt-6 text-[14px] text-ink-2">
              <Link href="/lavender" className="underline underline-offset-4 hover:text-ink">
                Their pieces in our shop ({maker.productIds.length})
              </Link>
            </p>
          )}
        </div>
      </article>
    </Section>
  );
}
