'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type FeaturedCider = {
  slug: string;
  name: string;
  tagline: string;
  story: string;
  tastingNotes: string;
  abv: string;
  volume: string;
  image: string;
};

// Hand-curated featured releases. Names match the VinoShipper catalog so
// customers see the same product in the showcase and the catalog below.
// Edit story/tasting notes/photos here without touching the slider code.
const FEATURED: FeaturedCider[] = [
  {
    slug: 'forest-king',
    name: 'Forest King',
    tagline: 'A Pacific Northwest signature',
    story:
      'Born right here on our farm, where rows of fragrant lavender grow alongside our orchards. We harvest both at their peak, creating a cider that captures the unique terroir of Olympic Bluffs.',
    tastingNotes:
      'Bold black currant over a clean apple base. Deep, jammy berries layered with subtle herbaceous finish — a truly Pacific Northwest creation.',
    abv: '6.9%',
    volume: '750ml',
    image: '/images/shop/cider/trans-lavender-black-currant.png',
  },
  {
    slug: 'sundrift',
    name: 'Sundrift',
    tagline: 'Sun-ripened summer',
    story:
      'A celebration of the classic peninsula pairing — sun-ripened strawberries and garden-fresh rhubarb. Crafted at peak harvest to capture a Pacific Northwest summer in every bottle.',
    tastingNotes:
      'Tart rhubarb and bright strawberry with lively acidity. A beautiful blush color, light and refreshing, finishing crisp and clean.',
    abv: '6.9%',
    volume: '750ml',
    image: '/images/shop/cider/trans-strawberry-rhubarb.png',
  },
  {
    slug: 'duskrun',
    name: 'Duskrun',
    tagline: 'Wild and forested',
    story:
      'Inspired by the forests around our farm, where wild salal and native botanicals grow beside the orchards. A taste of the Olympic Peninsula’s diverse flora in every sip.',
    tastingNotes:
      'Earthy botanicals and dark forest berries with subtle tannin. Deep purple hue, slightly sweet with a long herbaceous finish.',
    abv: '6.9%',
    volume: '750ml',
    image: '/images/shop/cider/trans-lavender-salal.png',
  },
];

export default function FeaturedCiderShowcase() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Update active index based on scroll position so dots/arrows stay in sync
  // with native touch swiping.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => {
      const slideWidth = track.clientWidth;
      if (slideWidth === 0) return;
      const i = Math.round(track.scrollLeft / slideWidth);
      setActiveIndex(i);
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => track.removeEventListener('scroll', handleScroll);
  }, []);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slideWidth = track.clientWidth;
    track.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
  };

  const handleShopClick = () => {
    document
      .getElementById('cider-catalog')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="bg-gradient-to-b from-white to-sage-50/40 py-16 lg:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-10 lg:mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-sage-600 mb-3">
            Featured Releases
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            From Orchard to Bottle
          </h2>
          <div className="flex justify-center">
            <div className="w-20 h-0.5 bg-sage-400 rounded-full" />
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          <div
            ref={trackRef}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide"
          >
            {FEATURED.map((cider) => (
              <div
                key={cider.slug}
                className="flex-shrink-0 w-full snap-start"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center px-2 lg:px-12">
                  {/* Bottle */}
                  <div className="relative h-[400px] sm:h-[480px] lg:h-[560px]">
                    <Image
                      src={cider.image}
                      alt={cider.name}
                      fill
                      sizes="(min-width: 1024px) 500px, (min-width: 640px) 400px, 100vw"
                      className="object-contain drop-shadow-2xl"
                      priority={cider.slug === FEATURED[0].slug}
                    />
                  </div>

                  {/* Copy */}
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-sage-600 mb-3">
                      {cider.tagline}
                    </p>
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                      {cider.name}
                    </h3>

                    <p className="text-base lg:text-lg text-gray-700 leading-relaxed mb-5">
                      {cider.story}
                    </p>
                    <p className="text-base lg:text-lg text-gray-600 italic leading-relaxed mb-8 border-l-2 border-sage-300 pl-4">
                      {cider.tastingNotes}
                    </p>

                    <div className="flex items-center gap-6 mb-8 text-sm">
                      <div>
                        <div className="text-gray-400 uppercase text-xs tracking-wider mb-0.5">
                          Volume
                        </div>
                        <div className="font-semibold text-gray-900">{cider.volume}</div>
                      </div>
                      <div className="w-px h-10 bg-gray-200" />
                      <div>
                        <div className="text-gray-400 uppercase text-xs tracking-wider mb-0.5">
                          ABV
                        </div>
                        <div className="font-semibold text-gray-900">{cider.abv}</div>
                      </div>
                    </div>

                    <button
                      onClick={handleShopClick}
                      className="inline-flex items-center gap-2 px-7 py-3 bg-sage-600 text-white rounded-md font-semibold hover:bg-sage-700 transition-all duration-200 hover:shadow-lg"
                    >
                      Order Below
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prev / Next arrows (desktop) */}
          <button
            onClick={() => goTo(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            aria-label="Previous cider"
            className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 items-center justify-center w-12 h-12 bg-white border border-sage-200 rounded-full shadow-md hover:bg-sage-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
          >
            <svg
              className="w-5 h-5 text-sage-700"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            onClick={() => goTo(Math.min(FEATURED.length - 1, activeIndex + 1))}
            disabled={activeIndex === FEATURED.length - 1}
            aria-label="Next cider"
            className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 items-center justify-center w-12 h-12 bg-white border border-sage-200 rounded-full shadow-md hover:bg-sage-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
          >
            <svg
              className="w-5 h-5 text-sage-700"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>

        {/* Dot pagination */}
        <div className="flex justify-center gap-2 mt-10">
          {FEATURED.map((cider, i) => (
            <button
              key={cider.slug}
              onClick={() => goTo(i)}
              aria-label={`Go to ${cider.name}`}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex
                  ? 'w-8 bg-sage-600'
                  : 'w-2 bg-sage-300 hover:bg-sage-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
