import Link from 'next/link';

/**
 * Small layout primitives shared by every public page so sections line up
 * the same way everywhere.
 */

type Tone = 'ground' | 'alt' | 'lavender' | 'amber' | 'strait' | 'dark' | 'paper';

const TONES: Record<Tone, string> = {
  ground: 'bg-ground',
  alt: 'bg-ground-2',
  lavender: 'bg-lav-2',
  amber: 'bg-amber-2',
  strait: 'bg-strait-2',
  dark: 'bg-sage-deep text-white',
  paper: 'bg-paper',
};

export function Section({
  tone = 'ground',
  tight = false,
  id,
  className = '',
  children,
}: {
  tone?: Tone;
  tight?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`${TONES[tone]} ${tight ? 'py-12 sm:py-14' : 'py-16 sm:py-20'} ${className}`}>
      <div className="container-x">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}

export function SectionTitle({
  children,
  size = 'md',
  className = '',
  as: Tag = 'h2',
}: {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  const sizes = {
    sm: 'text-[clamp(24px,3vw,32px)]',
    md: 'text-[clamp(28px,4vw,44px)]',
    lg: 'text-[clamp(34px,5vw,56px)]',
  };
  return (
    <Tag className={`mt-1.5 font-serif leading-[1.05] ${sizes[size]} ${className}`}>{children}</Tag>
  );
}

/** Eyebrow + title on the left, optional link on the right. */
export function SectionHeader({
  eyebrow,
  title,
  link,
  eyebrowClass = '',
  className = '',
}: {
  eyebrow?: string;
  title: React.ReactNode;
  link?: { label: string; href: string };
  eyebrowClass?: string;
  className?: string;
}) {
  return (
    <div className={`mb-8 flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && <Eyebrow className={eyebrowClass}>{eyebrow}</Eyebrow>}
        <SectionTitle className="max-w-[22ch]">{title}</SectionTitle>
      </div>
      {link && (
        <Link href={link.href} className="btn btn-secondary">
          {link.label}
        </Link>
      )}
    </div>
  );
}
