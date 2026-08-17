'use client';

import { useEffect, useState } from 'react';

// Site-wide dismissible announcement bar for the Yoga + Cider mornings
// hosted with Rebelution Yoga + Wellness. Ticketing is handled on their
// site, so the link goes out rather than to an internal page.
const TICKETS_URL = 'https://rebelutionyoga.com/event/yoga-cider-at-olympic-bluffs/';

// Versioned per event run so a future event can reuse the banner by
// changing the key, un-hiding it for visitors who dismissed this one.
const DISMISS_KEY = 'dismissed-yoga-cider-2026';

export default function YogaCiderBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (private mode) — show without persistence
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Ignore - banner stays dismissed for this page view only
    }
  };

  if (!visible) return null;

  return (
    <div className="bg-lavender-700 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-3">
        <p className="text-sm text-center leading-snug">
          <span className="font-bold tracking-wide">YOGA + CIDER</span>
          <span className="text-white/85"> · Sat Sept 19 &amp; Oct 17 · 10:30 am · $33 · </span>
          <a
            href={TICKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:text-lavender-100 transition-colors whitespace-nowrap"
          >
            Reserve your mat →
          </a>
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="flex-none p-1 rounded hover:bg-white/15 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
