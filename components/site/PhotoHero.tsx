import Image from 'next/image';
import Link from 'next/link';

interface Cta {
  label: string;
  href: string;
  variant?: 'onphoto' | 'ghost';
  external?: boolean;
}

interface PhotoHeroProps {
  image: string;
  alt: string;
  title: string;
  kicker?: string;
  text?: string;
  ctas?: Cta[];
  /** 'full' ≈ 78vh (homepage), 'tall' ≈ 520px, 'short' ≈ 360px */
  size?: 'full' | 'tall' | 'short';
  /** Where the photo's focal point sits. */
  position?: string;
  priority?: boolean;
  children?: React.ReactNode;
}

const SIZES = {
  full: 'min-h-[78vh] min-h-[560px]',
  tall: 'min-h-[520px]',
  short: 'min-h-[380px]',
};

/**
 * Full-bleed photo hero with the headline set over the image. Marked with
 * data-hero so the fixed header goes transparent over it (see globals.css).
 */
export default function PhotoHero({
  image,
  alt,
  title,
  kicker,
  text,
  ctas = [],
  size = 'tall',
  position = 'center',
  priority = true,
  children,
}: PhotoHeroProps) {
  return (
    <section data-hero className={`relative flex items-end overflow-hidden text-white ${SIZES[size]}`}>
      <Image
        src={image}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: position }}
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,26,22,.38)_0%,rgba(20,26,22,0)_38%,rgba(20,26,22,.6)_100%)]"
        aria-hidden="true"
      />
      <div className="container-x relative z-10 pb-12 pt-32 sm:pb-14">
        <div className="max-w-3xl">
          {kicker && <p className="eyebrow mb-3 text-white/80">{kicker}</p>}
          <h1
            className="font-serif text-[clamp(38px,6.5vw,72px)] leading-[1] tracking-[-0.005em]"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,.28)' }}
          >
            {title}
          </h1>
          {text && (
            <p className="mt-4 max-w-[48ch] text-[17px] leading-relaxed opacity-95" style={{ textShadow: '0 1px 12px rgba(0,0,0,.3)' }}>
              {text}
            </p>
          )}
          {ctas.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {ctas.map((cta) =>
                cta.external ? (
                  <a
                    key={cta.label}
                    href={cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn ${cta.variant === 'ghost' ? 'btn-ghost' : 'btn-onphoto'}`}
                  >
                    {cta.label}
                  </a>
                ) : (
                  <Link key={cta.label} href={cta.href} className={`btn ${cta.variant === 'ghost' ? 'btn-ghost' : 'btn-onphoto'}`}>
                    {cta.label}
                  </Link>
                )
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
