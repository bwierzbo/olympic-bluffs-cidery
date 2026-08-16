// Home page announcement for the Yoga + Cider mornings hosted with
// Rebelution Yoga + Wellness. Ticketing is handled on their site, so the
// CTA links out rather than to an internal event page.
const TICKETS_URL = 'https://rebelutionyoga.com/event/yoga-cider-at-olympic-bluffs/';

export default function YogaCiderEvent() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-14 h-0.5 bg-lavender-400 mx-auto mb-7" />

        <p className="text-xs font-bold tracking-[0.25em] uppercase text-sage-500 mb-5">
          Special Event
        </p>

        <h2 className="text-2xl md:text-4xl font-light leading-snug text-gray-900 max-w-2xl mx-auto mb-6">
          A morning of <span className="font-semibold">yoga in the lavender</span>,
          and a glass of <span className="font-semibold">cider</span> after.
        </h2>

        <p className="text-base md:text-lg font-semibold text-gray-900 tracking-wide mb-1">
          Saturday, Sept 19 &nbsp;·&nbsp; Saturday, Oct 17
        </p>
        <p className="text-sm md:text-base text-sage-500 mb-7">
          10:30 am – 12:30 pm · $33 · all levels · with Rebelution Yoga + Wellness
        </p>

        <a
          href={TICKETS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lavender-700 font-semibold underline underline-offset-4 hover:text-lavender-800 transition-colors"
        >
          Reserve your mat →
        </a>
      </div>
    </section>
  );
}
