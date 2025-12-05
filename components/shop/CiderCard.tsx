'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useCart } from './CartProvider';
import { useState } from 'react';

interface CiderCardProps {
  product: Product;
}

export default function CiderCard({ product }: CiderCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    addToCart(product, 1);

    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="text-center">
        {/* Product Image - no background, no border */}
        <div className="relative h-[450px] mb-6">
          <Image
            src={product.image || '/images/products/placeholder-cider.svg'}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 500px, 100vw"
            loading="eager"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold">
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Price and Volume */}
        <div className="text-base text-gray-700 mb-1">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          <span className="text-gray-500"> | {product.volume || '750ml'}</span>
        </div>

        {/* ABV */}
        <div className="text-sm text-gray-600 mb-2">
          {product.abv || '7%'} ABV
        </div>

        {/* Taste */}
        {product.taste && (
          <p className="text-base font-semibold text-gray-700 mb-4">
            {product.taste}
          </p>
        )}
        {!product.taste && <div className="mb-4" />}

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock || isAdding}
          className={`px-6 py-2.5 rounded-md font-medium transition-all duration-300 ${
            product.inStock
              ? isAdding
                ? 'bg-green-500 text-white'
                : 'bg-sage-600 text-white hover:bg-sage-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isAdding ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
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
          ) : (
            'Add to Cart'
          )}
        </button>
      </div>
    </Link>
  );
}
