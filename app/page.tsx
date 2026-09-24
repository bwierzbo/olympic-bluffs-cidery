import Image from 'next/image';
import Link from 'next/link';
import PhotoHero from '@/components/site/PhotoHero';
import StatusStrip from '@/components/site/StatusStrip';
import ExperienceGrid from '@/components/site/ExperienceGrid';
import FeaturedCider from '@/components/site/FeaturedCider';
import MakerSpotlight from '@/components/site/MakerSpotlight';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';
import { getFeaturedMaker } from '@/lib/content';
import { getFeaturedCider } from '@/lib/ciders';
import { getLavenderProducts } from '@/lib/lavender-products';
import { Product } from '@/lib/types';

// Events and seat counts come from the database; refreshed on every change
// (lib/events/revalidate.ts) and at least every 5 minutes.
export const revalidate = 300;

const BEATS = [
  {
    n: 'The land',
    title: 'High bluffs, maritime air',
    text: '360-degree views of the Strait of Juan de Fuca and the Olympic Mountains. Cool summers and long light, the same conditions that make Normandy and the West Country cider country.',
  },
  {
    n: 'The orchard',
    title: 'Bittersweets and heirlooms',
    text: 'Semi-dwarf trees of Kingston Black, Stoke Red, Ashmead’s Kernel, Northern Spy and more, planted for tannin and acid rather than sweetness.',
  },
  {
    n: 'The craft',
    title: 'Pressed here, poured here',
    text: 'Small tanks, slow ferments, and a tasting room in the cidery building. Some batches see bourbon barrels; some are blended with our own lavender or black currant.',
  },
];

/*
 * Lavender shop teaser. Pulled live from the Square catalog (same source as
 * /lavender). These four stand-ins with farm photos are only used when Square
 * is unreachable, so the homepage never shows an empty band.
 */
interface TeaserProduct {
  name: string;
  price: string;
  category: string;
  image: string;
  href: string;
}

const TEASER_PICKS = ['Lavender Essential Oil', 'Culinary Lavender Packet', 'Lavender Hydrosol', 'Lavender Lip Balm'];

function teaserFromProducts(products: Product[]): TeaserProduct[] {
  const withPhoto = products.filter((p) => p.image && !p.image.includes('placeholder'));
  const picked = TEASER_PICKS.map((n) => withPhoto.find((p) => p.name === n)).filter((p): p is Product => Boolean(p));
  const rest = withPhoto.filter((p) => !picked.includes(p));
  return [...picked, ...rest].slice(0, 4).map((p) => ({
    name: p.name,
    price: `$${(p.price / 100).toFixed(p.price % 100 === 0 ? 0 : 2)}`,
    category: p.category ?? '',
    image: p.image!,
    href: `/products/${p.id}`,
  }));
}

const LAVENDER_STAND_INS: TeaserProduct[] = [
  {
    name: 'Pure lavender essential oil',
    price: '$20',
    category: 'Essential oils',
    image: '/images/hours-lavender-basket.jpg',
    href: '/lavender',
  },
  {
    name: 'Lavender sachet',
    price: '$8',
    category: 'Home & fragrance',
    image: '/images/farm/the-fields.jpeg',
    href: '/lavender',
  },
  {
    name: 'Olympic Bluffs honey',
    price: '$14',
    category: 'Culinary',
    image: '/images/farm/apiary.jpg',
    href: '/lavender',
  },
  {
    name: 'Lavender candle',
    price: '$18',
    category: 'Home & fragrance',
    image: '/images/farm/lavender-boutique.jpeg',
    href: '/lavender',
  },
];

export default async function Home() {
  // Featured cider comes from VinoShipper; the band is skipped if the feed is down.
  const featuredCider = await getFeaturedCider().catch((error) => {
    console.error('Homepage: VinoShipper feed unavailable', error);
    return undefined;
  });
  const featuredMaker = getFeaturedMaker();
  const live = await getLavenderProducts().catch((error) => {
    console.error('Homepage: Square catalog unavailable, using stand-ins', error);
    return [] as Product[];
  });
  const teaser = live.length >= 4 ? teaserFromProducts(live) : LAVENDER_STAND_INS;

  return (
    <>
      <PhotoHero
        size="full"
        image="/images/farm/bluffs.jpeg"
        alt="The bluffs above the Strait of Juan de Fuca"
        title="Between the Strait and the Olympics."
        text="Twenty-one acres of cider apples, lavender, grain and bees on the high bluffs outside Port Angeles. Come for a glass, a bundle of lavender, or the weekend."
        ctas={[
          { label: 'Plan a visit', href: '/visit' },
          { label: 'Shop the farm', href: '/lavender', variant: 'ghost' },
        ]}
      />

      <StatusStrip />

      {/* The farm: intro statement and three beats */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>The farm</Eyebrow>
            <p className="mt-3 font-serif text-[clamp(28px,3.6vw,44px)] leading-[1.15]">
              We planted 480 cider apple trees, 3,400 lavender plants, an acre of ancient grain and an apiary on a
              bluff over the water.
            </p>
          </div>
          <div className="space-y-5 leading-relaxed text-ink-2 lg:pt-8">
            <p>
              We visited the peninsula for the first time during the 2015 lavender festival and moved here for good
              in 2020. Both of us are Air Force veterans; we spent twenty years learning to make a home in new
              places, and this is the one we chose.
            </p>
            <p>
              Everything we pour and sell starts in these fields. The cider is pressed, fermented and bottled on
              site. The lavender is cut by hand in July. The honey comes from Italian bees that work the orchard.
            </p>
            <Link href="/farm" className="btn btn-secondary">
              Walk the farm
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-8 border-t border-line pt-10 md:grid-cols-3 md:gap-10">
          {BEATS.map((beat, i) => (
            <div key={beat.n}>
              <p className="eyebrow text-amber">
                {String(i + 1).padStart(2, '0')} · {beat.n}
              </p>
              <h3 className="mt-2 font-serif text-2xl leading-tight">{beat.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{beat.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <ExperienceGrid />

      {featuredCider && <FeaturedCider cider={featuredCider} />}

      {/* Lavender shop teaser */}
      <Section tone="lavender">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow className="text-lav">The lavender shop</Eyebrow>
            <SectionTitle className="max-w-[22ch]">Cut by hand in July, made here all year</SectionTitle>
          </div>
          <Link href="/lavender" className="btn btn-secondary">
            Shop lavender
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {teaser.map((product) => (
            <li key={product.name}>
              <Link href={product.href} className="group block">
                <div className="relative aspect-square overflow-hidden bg-paper">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-3 font-serif text-lg leading-tight">{product.name}</p>
                <p className="mt-1 text-sm font-medium">{product.price}</p>
                <p className="eyebrow mt-1">{product.category}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {featuredMaker && <MakerSpotlight maker={featuredMaker} />}

      {/* Owners */}
      <Section tone="alt">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src="/images/home-owners.jpeg"
              alt="Scott and Ginger on the farm"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <Eyebrow>Scott and Ginger</Eyebrow>
            <SectionTitle className="max-w-[20ch]">We came for the festival and never really left</SectionTitle>
            <p className="mt-5 max-w-[56ch] leading-relaxed text-ink-2">
              In 2015 we visited the Olympic Peninsula for the first time during the lavender festival. Five years
              later we made it home. Since then we have planted an orchard, 3,400 lavender plants, an acre of
              grain, an apiary, and, in November 2024, opened Salt and Cedar Bed and Breakfast.
            </p>
            <Link href="/about" className="btn btn-secondary mt-7">
              Our story
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
