'use client';

import { useState, useCallback } from 'react';
import VideoEmbed from '@/components/VideoEmbed';

interface CarouselVideo {
  youtubeId: string;
  title: string;
  description?: string;
  // Loosely typed because the list comes from data/videos.json; we narrow to
  // the VideoEmbed union with `=== 'portrait'` checks below.
  orientation?: string;
}

interface VideoCarouselProps {
  videos: CarouselVideo[];
  /** Set when the carousel sits on a dark/green background so text + dots flip to light. */
  onDark?: boolean;
}

/**
 * One-at-a-time video carousel: hairline pill arrows, serif caption, ink dot
 * navigation. VideoEmbed is keyed by id so moving to another slide resets it
 * back to the click-to-play thumbnail.
 */
export default function VideoCarousel({ videos, onDark = false }: VideoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const titleColor = onDark ? 'text-white' : 'text-ink';
  const descColor = onDark ? 'text-white/75' : 'text-ink-2';
  const arrowClass = onDark
    ? 'border-white/40 text-white hover:border-white hover:bg-white/10'
    : 'border-line bg-paper text-ink hover:border-ink';

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
  }, [videos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
  }, [videos.length]);

  if (videos.length === 0) return null;

  const current = videos[currentIndex];
  const portrait = current.orientation === 'portrait';
  // Portrait clips (Shorts) get a phone-shaped column; landscape gets wider.
  const frameWidth = portrait ? 'max-w-xs' : 'max-w-3xl';

  const slide = (
    <>
      <VideoEmbed
        key={current.youtubeId}
        youtubeId={current.youtubeId}
        title={current.title}
        orientation={portrait ? 'portrait' : 'landscape'}
      />
      {(current.title || current.description) && (
        <div className="mt-4 text-center">
          {current.title && (
            <h3 className={`font-serif text-xl ${titleColor}`}>
              {current.title}
            </h3>
          )}
          {current.description && (
            <p className={`mt-1 text-sm leading-relaxed ${descColor}`}>
              {current.description}
            </p>
          )}
        </div>
      )}
    </>
  );

  // Single video: no controls needed.
  if (videos.length === 1) {
    return <div className={`mx-auto ${frameWidth}`}>{slide}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Slide + side arrows. Arrows sit outside the frame on wider screens. */}
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        <button
          onClick={goToPrevious}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage ${arrowClass}`}
          aria-label="Previous video"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className={`relative w-full ${frameWidth}`}>
          {slide}
          {/* Counter pill */}
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold tabular-nums text-white">
            {currentIndex + 1} / {videos.length}
          </div>
        </div>

        <button
          onClick={goToNext}
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage ${arrowClass}`}
          aria-label="Next video"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Dot navigation */}
      <div className="mt-6 flex justify-center gap-2">
        {videos.map((video, idx) => (
          <button
            key={video.youtubeId}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex
                ? `w-6 ${onDark ? 'bg-white' : 'bg-ink'}`
                : `w-2 ${onDark ? 'bg-white/40 hover:bg-white/70' : 'bg-ink/20 hover:bg-ink/40'}`
            }`}
            aria-label={`Go to video ${idx + 1}`}
            aria-current={idx === currentIndex}
          />
        ))}
      </div>
    </div>
  );
}
