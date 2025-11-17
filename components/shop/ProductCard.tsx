'use client';

import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCart } from './CartProvider';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, 1);

    // Reset button state after animation
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product Image */}
      <div className="relative h-64 bg-gray-100">
        <Image
          src={product.image || '/images/products/placeholder-lavender.svg'}
          alt={product.name}
          fill
          className="object-cover"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold">
              Out of Stock
            </span>
          </div>
        )}
        {/* Product Type Badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-sage-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {product.type}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-3 min-h-[4rem]">
          {product.description}
        </p>

        {/* Category */}
        {product.category && (
          <p className="text-xs text-sage-600 font-medium mb-3">
            {product.category}
          </p>
        )}

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || isAdding}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-300 ${
              product.inStock
                ? isAdding
                  ? 'bg-green-500 text-white'
                  : 'bg-sage-500 text-white hover:bg-sage-600'
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
      </div>
    </div>
  );
}
