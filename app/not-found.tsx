import Link from 'next/link';
import { Section } from '@/components/site/Section';

export default function NotFound() {
  return (
    <Section className="min-h-[60vh]">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-2 max-w-[18ch] font-serif text-[clamp(34px,5vw,56px)] leading-[1.05]">
        This path doesn’t lead anywhere on the farm.
      </h1>
      <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-ink-2">
        The page may have moved when we rebuilt the site. These will get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">
          Home
        </Link>
        <Link href="/visit" className="btn btn-secondary">
          Hours &amp; directions
        </Link>
        <Link href="/cider" className="btn btn-secondary">
          Cider
        </Link>
        <Link href="/lavender" className="btn btn-secondary">
          Lavender shop
        </Link>
      </div>
    </Section>
  );
}
