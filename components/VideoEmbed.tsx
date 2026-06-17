'use client';

import { useState } from 'react';
import Image from 'next/image';

interface VideoEmbedProps {
  youtubeId: string;
  title: string;
  /** 'portrait' for vertical clips like YouTube Shorts. Defaults to landscape. */
  orientation?: 'landscape' | 'portrait';
}

/**
 * Click-to-play YouTube facade.
 *
 * Shows a lightweight thumbnail image on first render and only loads the
 * (heavy) YouTube player iframe once the visitor clicks play. This keeps the
 * homepage fast since the ~500KB+ of player scripts are never loaded for
 * people who don't watch. Uses youtube-nocookie.com for privacy.
 */
export default function VideoEmbed({
  youtubeId,
  title,
  orientation = 'landscape',
}: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const aspectClass = orientation === 'portrait' ? 'aspect-[9/16]' : 'aspect-video';

  if (playing) {
    return (
      <div className={`relative ${aspectClass} w-full overflow-hidden rounded-lg bg-black`}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className={`group relative block ${aspectClass} w-full overflow-hidden rounded-lg bg-black focus:outline-none focus:ring-4 focus:ring-sage-400`}
    >
      <Image
        src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
        alt={title}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 80vw"
      />
      {/* Darkening overlay for contrast behind the play button */}
      <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
      {/* Play button */}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110 md:h-20 md:w-20">
          <svg
            className="ml-1 h-7 w-7 text-sage-600 md:h-9 md:w-9"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
