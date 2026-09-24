import type { Metadata } from 'next';
import { Section } from '@/components/site/Section';
import UnsubscribeButton from './UnsubscribeButton';

export const metadata: Metadata = {
  title: 'Unsubscribe · Olympic Bluffs',
  robots: { index: false, follow: false },
};

// The link only shows a button; nothing changes until it's pressed, so mail
// scanners that pre-fetch links can't unsubscribe anyone by accident.
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <Section className="min-h-[60vh]">
      <p className="eyebrow">Newsletter</p>
      <h1 className="mt-2 max-w-[20ch] font-serif text-[clamp(32px,4.5vw,48px)] leading-[1.05]">Unsubscribe from our emails</h1>
      {token ? (
        <UnsubscribeButton token={token} />
      ) : (
        <p className="mt-5 max-w-[52ch] text-ink-2">
          This link is missing its code. Use the unsubscribe link at the bottom of any of our emails, or write to{' '}
          <a href="mailto:info@olympicbluffs.com" className="underline underline-offset-4">
            info@olympicbluffs.com
          </a>{' '}
          and we’ll remove you.
        </p>
      )}
    </Section>
  );
}
