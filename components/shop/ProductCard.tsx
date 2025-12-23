'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useCart } from './CartProvider';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const hasMultipleVariations = product.variations && product.variations.length > 1;

  const getPriceDisplay = () => {
    if (!hasMultipleVariations) {
      return formatPrice(product.price);
    }

    // If variations have different prices, show range
    const prices = product.variations!.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return formatPrice(minPrice);
    }

    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);

    const variationToAdd = product.variations && product.variations.length === 1
      ? product.variations[0]
      : undefined;

    addToCart(product, 1, variationToAdd);

    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  return (
    <Link href={`/products/${product.id}`} className="block group text-center">
      <div
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Product Image - Square with hover crossfade */}
        <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
          {/* Main Image */}
          <Image
            src={product.image || '/images/products/placeholder-lavender.svg'}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className={`object-cover transition-all duration-300 ${
              isHovered && product.hoverImage ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            } ${isHovered && !product.hoverImage ? 'scale-105' : ''}`}
          />

          {/* Hover Image (if exists) - crossfade effect */}
          {product.hoverImage && (
            <Image
              src={product.hoverImage}
              alt={`${product.name} - in use`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className={`absolute inset-0 object-cover transition-all duration-300 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          )}

          {/* Hover Overlay Button */}
          {product.inStock && isHovered && (
            <div className="absolute inset-0 flex items-end justify-center pb-4 transition-opacity duration-300">
              <button
                onClick={hasMultipleVariations ? undefined : handleAddToCart}
                className="px-6 py-3 bg-white text-gray-900 font-semibold text-lg rounded-md shadow-lg transition-all duration-300 hover:bg-gray-100"
              >
                {isAdding ? (
                  <span className="flex items-center gap-2">
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
                ) : hasMultipleVariations ? (
                  'Customize'
                ) : (
                  'Add to Cart'
                )}
              </button>
            </div>
          )}

          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold">
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Price */}
        <p className="text-lg text-gray-700">
          {getPriceDisplay()}
        </p>
      </div>
    </Link>
  );
}
