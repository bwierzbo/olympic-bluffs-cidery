'use client';

import Script from 'next/script';
import type { FC } from 'react';

// Behold (behold.so) renders this custom element once its widget script loads.
// Typed loosely because it's a web component, not a React component.
const BeholdWidget = 'behold-widget' as unknown as FC<{ 'feed-id': string }>;

// Public Behold feed ID (safe to commit — it's exposed in the rendered page).
// NEXT_PUBLIC_BEHOLD_FEED_ID can override it to swap feeds without a code change.
const FEED_ID =
  process.env.NEXT_PUBLIC_BEHOLD_FEED_ID ?? 'dpdpmRHvW6FFeGdan6wE';
const INSTAGRAM_URL = 'https://www.instagram.com/olympicbluffscideryandlavender/';

export default function InstagramFeed() {
  // Until a feed is configured, show a friendly placeholder so the page still
  // looks finished and points visitors to Instagram in the meantime.
  if (!FEED_ID) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border-2 border-dashed border-white/40 px-6 py-10 text-center">
        <p className="font-medium text-white">Our Instagram feed will appear here soon.</p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sage-50 underline underline-offset-4 hover:text-white"
        >
          Follow @olympicbluffscideryandlavender
        </a>
      </div>
    );
  }

  return (
    <>
      <Script src="https://w.behold.so/widget.js" type="module" strategy="lazyOnload" />
      <BeholdWidget feed-id={FEED_ID} />
    </>
  );
}
