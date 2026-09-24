import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/site/Section';
import { getSiteConfig } from '@/lib/site-config';
import LavenderShop from './LavenderShop';

export async function generateMetadata(): Promise<Metadata> {
  const showLavender = getSiteConfig().navigation.showLavender;
  return {
    title: 'Lavender shop · Olympic Bluffs',
    description:
      'Essential oils, culinary buds, honey and body care made from lavender cut by hand on our farm on the Olympic Peninsula.',
    robots: showLavender ? undefined : { index: false, follow: false },
  };
}

function Intro() {
  return (
    <Section tone="lavender" tight>
      <p className="eyebrow text-lav">The lavender shop</p>
      <h1 className="mt-1.5 max-w-[20ch] font-serif text-[clamp(34px,5vw,56px)] leading-[1.05]">
        Cut by hand in July, made here all year
      </h1>
      <p className="mt-5 max-w-[60ch] text-[16px] leading-relaxed text-ink-2">
        Most of what is on these shelves starts in our fields: oils distilled from our own harvest, culinary buds, honey
        from the apiary. The rest is made by the makers we work with.
      </p>
      <p className="mt-3 text-sm text-ink-3">
        Lavender orders check out through Square; cider checks out separately through{' '}
        <Link href="/cider#ciders" className="underline underline-offset-4 hover:text-ink">
          VinoShipper
        </Link>
        .
      </p>
    </Section>
  );
}

export default function LavenderPage() {
  const showLavender = getSiteConfig().navigation.showLavender;

  // The shop can be switched off in site-config while the Square catalog is
  // being set up. The intro still renders so the page is not a dead end.
  if (!showLavender) {
    return (
      <>
        <Intro />
        <Section>
          <div className="max-w-[60ch]">
            <p className="eyebrow">Coming soon</p>
            <h2 className="mt-1.5 font-serif text-[clamp(28px,4vw,44px)] leading-[1.05]">
              The online shop opens shortly
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-2">
              We are moving the boutique online one shelf at a time. Until then, everything is in the farm boutique
              during open hours.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/visit" className="btn btn-primary">
                Plan a visit
              </Link>
              <Link href="/" className="btn btn-secondary">
                Back home
              </Link>
            </div>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <Intro />
      <LavenderShop />
    </>
  );
}
