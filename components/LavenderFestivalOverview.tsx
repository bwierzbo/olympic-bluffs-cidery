import Image from 'next/image';
import Link from 'next/link';

// Homepage teaser for the lavender festival. Replaces the full schedule
// embed so visitors don't read the Friday-Sunday vendor/food-truck hours
// as our regular weekend programming. The full schedule lives at
// /events/lavender-festival.
export default function LavenderFestivalOverview() {
  return (
    <section className="relative overflow-hidden">
      <Image
        src="/images/farm/lavender-banner.jpg"
        alt="Lavender fields at Olympic Bluffs"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-lavender-700/60" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-white/85 mb-3">
          Annual Event · One Weekend Only
        </p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-[0.15em] text-white mb-3">
          LAVENDER FESTIVAL WEEKEND
        </h2>
        <p className="text-xl md:text-2xl font-bold tracking-[0.15em] text-white mb-6">
          JULY 17 – 19, 2026
        </p>

        <p className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-white/95 mb-3">
          Three days of artisan vendors, food trucks, kite flying and live
          music in the lavender fields — our biggest weekend of the year.
        </p>
        <p className="max-w-2xl mx-auto text-sm md:text-base text-white/80 italic mb-10">
          The vendor market and food trucks are exclusive to festival weekend,
          not part of regular farm hours.
        </p>

        <Link
          href="/events/lavender-festival"
          className="inline-block bg-white text-lavender-700 px-8 py-3 rounded-md font-semibold hover:bg-lavender-50 transition-colors"
        >
          See the Full Schedule
        </Link>
      </div>
    </section>
  );
}
