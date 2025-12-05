'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCart } from './CartProvider';

interface FeaturedCiderSectionProps {
  products: Product[];
}

// Placeholder descriptions for featured ciders (editable)
// Each cider has a left paragraph (story/origin) and right paragraph (tasting notes)
const ciderDescriptions: Record<string, { left: string; right: string }> = {
  'strawberry-rhubarb': {
    left: 'Born from the vibrant gardens of the Olympic Peninsula, this cider celebrates the classic pairing of sun-ripened strawberries and garden-fresh rhubarb. Each batch is crafted during peak harvest season to capture the essence of a Pacific Northwest summer.',
    right: 'Light and refreshing with a beautiful blush color. Sweet strawberry notes dance with tart rhubarb on the palate, finishing crisp and clean. Perfect chilled on a warm afternoon or paired with light desserts.',
  },
  'salish': {
    left: 'Named after the Salish Sea that shapes our coastal landscape, this traditional cider honors the heritage of the Olympic Peninsula. We blend heirloom apple varieties grown in our region for generations, connecting each sip to the land and its history.',
    right: 'A complex, balanced character with subtle earthy notes and hints of wild honey. Medium-bodied with gentle tannins and a long, satisfying finish. Pairs beautifully with aged cheeses and roasted meats.',
  },
  'lavender-black-currant': {
    left: 'An enchanting fusion born right here on our farm, where rows of fragrant lavender grow alongside our orchards. We harvest both at their peak, creating a cider that captures the unique terroir of Olympic Bluffs.',
    right: 'Floral lavender aromatics meet deep, jammy black currant on the nose. The palate reveals layers of berry sweetness balanced by the calming essence of lavender. A truly unique Pacific Northwest creation.',
  },
  'lavender-salal': {
    left: 'Wild salal berries have sustained the people of this region for thousands of years. We forage these native berries from the forests surrounding our farm and marry them with our signature lavender for a distinctly local experience.',
    right: 'Deep purple hue with aromas of wild berries and gentle floral notes. Earthy and slightly sweet with a subtle herbaceous quality. A taste of the Olympic Peninsula\'s diverse flora in every sip.',
  },
  'ginger-quince': {
    left: 'Inspired by the orchards of old, where quince trees stood alongside apples. We source aromatic quince from heritage trees and add warming ginger root, creating an autumn-inspired cider perfect for cooler days.',
    right: 'Golden amber color with spicy ginger on the nose and honeyed quince underneath. Warming and complex on the palate with a pleasantly dry finish. Ideal served slightly warm or at cellar temperature.',
  },
  'ashmeads-kernel': {
    left: 'The legendary Ashmead\'s Kernel apple, first cultivated in 1700s Gloucestershire, produces one of the world\'s finest single-varietal ciders. We tend these heritage trees with care, honoring centuries of cidermaking tradition.',
    right: 'Nutty and sharp with remarkable complexity. Notes of honeyed fruit and subtle tropical hints give way to a long, bone-dry finish. A sophisticated cider for those who appreciate depth and character.',
  },
  'kingston-black': {
    left: 'The Kingston Black is revered as the "king of cider apples" - one of the rare varieties that can produce exceptional cider entirely on its own. Our trees thrive in the maritime climate of the Olympic Peninsula.',
    right: 'Full-bodied with firm tannic structure and deep apple character. Bittersweet notes mingle with hints of smoke and earth. A traditional English-style cider offering depth, sophistication, and excellent aging potential.',
  },
};

// Get descriptions by matching product name
const getDescriptions = (productName: string, originalDescription?: string): { left: string; right: string } => {
  const nameLower = productName.toLowerCase();

  for (const [key, descriptions] of Object.entries(ciderDescriptions)) {
    if (nameLower.includes(key.replace(/-/g, ' ')) || nameLower.includes(key.replace(/-/g, ''))) {
      return descriptions;
    }
  }

  // Fallback descriptions
  return {
    left: originalDescription || 'Handcrafted with care at Olympic Bluffs Cidery, using locally sourced ingredients from the Olympic Peninsula. Each batch reflects our commitment to quality and tradition.',
    right: 'A refreshing and balanced cider perfect for any occasion. Enjoy chilled with friends or paired with your favorite Pacific Northwest cuisine.',
  };
};

export default function FeaturedCiderSection({ products }: FeaturedCiderSectionProps) {
  const { addToCart } = useCart();
  const [scrollY, setScrollY] = useState(0);
  const [addingProduct, setAddingProduct] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Track scroll position for parallax effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for fade-up animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = contentRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setVisibleSections((prev) => new Set([...prev, index]));
            }
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    contentRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [products.length]);

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
    if (!section || typeof window === 'undefined') return 0;

    const rect = section.getBoundingClientRect();
    const sectionTop = rect.top + scrollY;
    const sectionHeight = rect.height;
    const viewportHeight = window.innerHeight;

    const scrollProgress = (scrollY + viewportHeight - sectionTop) / (sectionHeight + viewportHeight);

    if (scrollProgress > 0 && scrollProgress < 1) {
      return scrollProgress * 80 * 0.3;
    }

    return 0;
  };

  if (products.length === 0) return null;

  // Alternating background styles
  const getBgStyle = (index: number) => {
    const styles = [
      'bg-gradient-to-b from-white via-sage-50/30 to-sage-50/50',
      'bg-gradient-to-b from-sage-50/50 via-white to-sage-50/30',
      'bg-gradient-to-b from-sage-50/30 via-sage-100/20 to-white',
    ];
    return styles[index % styles.length];
  };

  return (
    <div>
      {products.map((product, index) => {
        const parallaxOffset = getParallaxOffset(index);
        const isAdding = addingProduct === product.id;
        const isVisible = visibleSections.has(index);
        const descriptions = getDescriptions(product.name, product.description);

        return (
          <div
            key={product.id}
            ref={(el) => {
              sectionRefs.current[index] = el;
            }}
            className={`relative min-h-screen flex items-center overflow-hidden ${getBgStyle(index)}`}
          >
            <div
              ref={(el) => {
                contentRefs.current[index] = el;
              }}
              className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-20"
            >
              {/* Product Name - Centered above everything */}
              <div className="text-center mb-8 lg:mb-12">
                <h2
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                  }}
                >
                  {product.name}
                </h2>
                <div
                  className="flex justify-center"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                    transitionDelay: '50ms',
                  }}
                >
                  <div className="w-24 h-0.5 bg-sage-400 rounded-full" />
                </div>
              </div>

              {/* Three Column Layout: Left Text | Bottle | Right Text */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
                {/* Left Text - Fades in from left */}
                <div
                  className="order-2 lg:order-1 text-center lg:text-right"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(-40px)',
                    transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
                    transitionDelay: '200ms',
                  }}
                >
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {descriptions.left}
                  </p>
                </div>

                {/* Center - Bottle with Parallax + Rise Up Animation */}
                <div className="order-1 lg:order-2 relative h-[400px] sm:h-[500px] lg:h-[550px]">
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: `translateY(${isVisible ? -parallaxOffset : 50 - parallaxOffset}px)`,
                      transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                    }}
                  >
                    <div className="relative w-full h-full max-w-xs lg:max-w-sm">
                      <Image
                        src={product.image || '/images/products/placeholder-cider.svg'}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1024px) 350px, (min-width: 640px) 300px, 250px"
                        className="object-contain drop-shadow-2xl"
                        priority={index === 0}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Text - Fades in from right */}
                <div
                  className="order-3 text-center lg:text-left"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(40px)',
                    transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
                    transitionDelay: '400ms',
                  }}
                >
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {descriptions.right}
                  </p>
                </div>
              </div>

              {/* Bottom Section - Details, Price, and Button */}
              <div className="mt-10 lg:mt-14 text-center">
                {/* Product Details */}
                <div
                  className="flex items-center justify-center gap-4 sm:gap-8 text-base sm:text-lg mb-6"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                    transitionDelay: '500ms',
                  }}
                >
                  {product.volume && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Volume</span>
                      <span className="font-semibold text-gray-900">{product.volume}</span>
                    </div>
                  )}
                  {product.volume && product.abv && (
                    <div className="w-px h-6 bg-gray-300" />
                  )}
                  {product.abv && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">ABV</span>
                      <span className="font-semibold text-gray-900">{product.abv}</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div
                  className="text-4xl sm:text-5xl font-bold text-sage-600 mb-6"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                    transitionDelay: '550ms',
                  }}
                >
                  {formatPrice(product.price)}
                </div>

                {/* Add to Cart Button */}
                <div
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                    transitionDelay: '600ms',
                  }}
                >
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock || isAdding}
                    className={`px-10 py-4 rounded-md font-semibold text-lg shadow-lg transition-all duration-300 ${
                      product.inStock
                        ? isAdding
                          ? 'bg-green-500 text-white scale-105'
                          : 'bg-sage-600 text-white hover:bg-sage-700 hover:shadow-xl hover:scale-105'
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

            {/* Section Separator */}
            {index < products.length - 1 && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 pb-8">
                <svg
                  className="w-6 h-6 text-sage-400 animate-bounce"
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
