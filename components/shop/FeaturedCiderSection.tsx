'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCart } from './CartProvider';

interface FeaturedCiderSectionProps {
  products: Product[];
}

export default function FeaturedCiderSection({ products }: FeaturedCiderSectionProps) {
  const { addToCart } = useCart();
  const [scrollY, setScrollY] = useState(0);
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track scroll position for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleAddToCart = (product: Product) => {
    setAddingProduct(product.id);
    addToCart(product, 1);

    setTimeout(() => {
      setAddingProduct(null);
    }, 1000);
  };

  // Calculate parallax offset for each section
  const getParallaxOffset = (index: number) => {
    const section = sectionRefs.current[index];
    if (!section) return 0;

    const rect = section.getBoundingClientRect();
    const sectionTop = rect.top + scrollY;
    const sectionHeight = rect.height;
    const viewportHeight = window.innerHeight;

    // Calculate how far through the section we've scrolled
    const scrollProgress = (scrollY + viewportHeight - sectionTop) / (sectionHeight + viewportHeight);

    // Apply parallax effect (moves at 50% of scroll speed)
    if (scrollProgress > 0 && scrollProgress < 1) {
      return scrollProgress * 100 * 0.5; // 50% parallax speed
    }

    return 0;
  };

  if (products.length === 0) return null;

  return (
    <div className="bg-gradient-to-b from-white to-sage-50">
      {products.map((product, index) => {
        const isEven = index % 2 === 0;
        const parallaxOffset = getParallaxOffset(index);
        const isAdding = addingProduct === product.id;

        return (
          <div
            key={product.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            className="relative min-h-screen flex items-center overflow-hidden"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-20">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}>

                {/* Text Content */}
                <div className={`${isEven ? 'lg:order-1' : 'lg:order-2'} space-y-6`}>
                  <h2 className="text-5xl font-bold text-gray-900">
                    {product.name}
                  </h2>

                  {product.description && (
                    <p className="text-xl text-gray-700 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center gap-6 text-lg">
                    {product.volume && (
                      <div>
                        <span className="text-gray-600">Volume:</span>
                        <span className="ml-2 font-semibold text-gray-900">{product.volume}</span>
                      </div>
                    )}
                    {product.abv && (
                      <div>
                        <span className="text-gray-600">ABV:</span>
                        <span className="ml-2 font-semibold text-gray-900">{product.abv}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-4xl font-bold text-sage-600">
                    {formatPrice(product.price)}
                  </div>
                </div>

                {/* Bottle Image with Parallax */}
                <div className={`${isEven ? 'lg:order-2' : 'lg:order-1'} relative h-[600px] lg:h-[700px]`}>
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `translateY(-${parallaxOffset}px)`,
                      transition: 'transform 0.1s ease-out',
                    }}
                  >
                    <div className="relative w-full h-full max-w-md">
                      <Image
                        src={product.image || '/images/products/placeholder-cider.svg'}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-contain"
                        priority={index === 0}
                      />

                      {/* Add to Cart Button - Positioned at bottom of image */}
                      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-xs px-4">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock || isAdding}
                          className={`w-full py-4 px-6 rounded-md font-semibold text-lg shadow-2xl transition-all duration-300 ${
                            product.inStock
                              ? isAdding
                                ? 'bg-green-500 text-white'
                                : 'bg-sage-600 text-white hover:bg-sage-700 hover:shadow-xl'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isAdding ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg
                                className="animate-spin h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Added!
                            </span>
                          ) : product.inStock ? (
                            'Add to Cart'
                          ) : (
                            'Out of Stock'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
