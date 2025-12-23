'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

export default function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return (
      <div className="relative aspect-square max-w-lg mx-auto">
        <Image
          src={images[0]}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 500px, (min-width: 640px) 400px, 100vw"
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Main Image */}
      <div className="relative aspect-square mb-4 bg-gray-50 rounded-lg overflow-hidden">
        <Image
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          fill
          sizes="(min-width: 1024px) 500px, (min-width: 640px) 400px, 100vw"
          className="object-contain transition-opacity duration-300"
          priority={currentIndex === 0}
        />

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-lg transition-all"
          aria-label="Previous image"
        >
          <svg
            className="w-5 h-5 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/80 hover:bg-white rounded-full shadow-lg transition-all"
          aria-label="Next image"
        >
          <svg
            className="w-5 h-5 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Image Counter */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="flex gap-2 justify-center flex-wrap">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => goToIndex(idx)}
            className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
              idx === currentIndex
                ? 'border-sage-500 ring-2 ring-sage-200'
                : 'border-transparent hover:border-gray-300'
            }`}
            aria-label={`View image ${idx + 1}`}
          >
            <Image
              src={img}
              alt={`${alt} thumbnail ${idx + 1}`}
              fill
              sizes="64px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
