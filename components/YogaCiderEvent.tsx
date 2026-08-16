import Image from 'next/image';

// Home page announcement for the Yoga + Cider mornings hosted with
// Rebelution Yoga + Wellness. Ticketing is handled on their site, so the
// CTA links out rather than to an internal event page.
const TICKETS_URL = 'https://rebelutionyoga.com/event/yoga-cider-at-olympic-bluffs/';

export default function YogaCiderEvent() {
  return (
    <section className="relative overflow-hidden">
      <Image
        src="/images/farm/lavender-banner.jpg"
        alt="Lavender fields at Olympic Bluffs"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-sage-700/60" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-white/85 mb-3">
          Special Event · Two Saturday Mornings
        </p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-[0.15em] text-white mb-3">
          YOGA + CIDER
        </h2>
        <p className="text-lg md:text-2xl font-bold tracking-[0.15em] text-white mb-6">
          SEPT 19 &amp; OCT 17 · 10:30 AM
        </p>

        <p className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-white/95 mb-3">
          An all-levels outdoor flow with the Olympics behind you and the
          Strait beyond the lavender rows — then a glass of our cider when
          you roll up your mat.
        </p>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-white/80 mb-10">
          $33 · Hosted with Rebelution Yoga + Wellness · All levels welcome
        </p>

        <a
          href={TICKETS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-white text-sage-700 px-8 py-3 rounded-md font-semibold hover:bg-sage-50 transition-colors"
        >
          Get Tickets
        </a>
      </div>
    </section>
  );
}
