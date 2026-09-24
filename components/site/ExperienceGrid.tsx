import Image from 'next/image';
import Link from 'next/link';
import { Eyebrow, Section, SectionTitle } from '@/components/site/Section';

interface Door {
  title: string;
  line: string;
  href: string;
  image: string;
  alt: string;
}

/**
 * "One farm, many doors": every business on the property gets a photo tile
 * that leads into its section of the site. Photos are farm shots that
 * already exist in /public/images.
 */
const DOORS: Door[] = [
  {
    title: 'Cider',
    line: 'Tasting room and bottles to go',
    href: '/cider',
    image: '/images/farm/keg.jpeg',
    alt: 'Cider tanks in the cidery building',
  },
  {
    title: 'Lavender',
    line: 'Oils, sachets, honey, made here',
    href: '/lavender',
    image: '/images/farm/lavender-boutique.jpeg',
    alt: 'Shelves inside the lavender boutique',
  },
  {
    title: 'Stay',
    line: 'Salt & Cedar Bed and Breakfast',
    href: '/stay',
    image: '/images/farm/salt-cedar-bnb.jpeg',
    alt: 'Salt and Cedar Bed and Breakfast',
  },
  {
    title: 'Visit',
    line: 'Hours, directions, what to expect',
    href: '/visit',
    image: '/images/farm/the-fields.jpeg',
    alt: 'Rows of lavender in bloom',
  },
  {
    title: 'Events',
    line: 'The festival, classes and tastings',
    href: '/events',
    image: '/images/home-lavender-hero.jpg',
    alt: 'Lavender fields during the festival',
  },
  {
    title: 'Makers',
    line: 'The artists and growers we work with',
    href: '/makers',
    image: '/images/farm/ancient-grains.jpeg',
    alt: 'The ancient grain field',
  },
];

export default function ExperienceGrid() {
  return (
    <Section tone="alt" tight>
      <Eyebrow>Find your way in</Eyebrow>
      <SectionTitle className="mb-8">One farm, many doors</SectionTitle>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {DOORS.map((door) => (
          <li key={door.href}>
            <Link
              href={door.href}
              className="group relative block aspect-[4/5] overflow-hidden bg-ink-3 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
            >
              <Image
                src={door.image}
                alt={door.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.04]"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(180deg,rgba(20,26,22,0)_0%,rgba(20,26,22,.72)_100%)]"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <span className="block font-serif text-[clamp(22px,2.6vw,30px)] leading-none">{door.title}</span>
                <span className="mt-1.5 block text-[13px] opacity-90 sm:text-sm">{door.line}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
