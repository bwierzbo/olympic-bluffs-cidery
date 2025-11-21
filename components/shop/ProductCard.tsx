'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariation } from '@/lib/types';
import { useCart } from './CartProvider';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(
    product.variations && product.variations.length > 0 ? product.variations[0] : null
  );
  const [multiDimSelections, setMultiDimSelections] = useState<Record<string, string>>({});

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const hasMultipleVariations = product.variations && product.variations.length > 1;

  // Check if variations have multiple dimensions (comma-separated)
  const isMultiDimensional = () => {
    if (!product.variations || product.variations.length <= 1) {
      return false;
    }
    return product.variations.some(v => v.name.includes(','));
  };

  // Parse multi-dimensional variations into separate dimension options
  const getVariationDimensions = () => {
    if (!product.variations) return [];

    const dimensionsMap: Record<number, Set<string>> = {};

    product.variations.forEach(variation => {
      const parts = variation.name.split(',').map(p => p.trim());
      parts.forEach((part, index) => {
        if (!dimensionsMap[index]) {
          dimensionsMap[index] = new Set();
        }
        dimensionsMap[index].add(part);
      });
    });

    return Object.values(dimensionsMap).map(set => Array.from(set).sort());
  };

  // Find variation matching multi-dimensional selections
  const findMatchingVariation = (selections: Record<string, string>) => {
    if (!product.variations) return null;

    const selectionValues = Object.values(selections);
    if (selectionValues.some(v => !v)) return null;

    const searchName = selectionValues.join(', ');
    return product.variations.find(v => v.name === searchName) || null;
  };

  // Initialize multi-dimensional selections on mount
  useEffect(() => {
    if (isMultiDimensional()) {
      const dimensions = getVariationDimensions();
      const initialSelections: Record<string, string> = {};
      dimensions.forEach((options, index) => {
        initialSelections[index] = options[0];
      });
      setMultiDimSelections(initialSelections);

      // Find and set the matching variation
      const matchingVariation = findMatchingVariation(initialSelections);
      if (matchingVariation) {
        setSelectedVariation(matchingVariation);
      }
    }
  }, [product.id]);

  // Handle multi-dimensional selection change
  const handleMultiDimChange = (dimensionIndex: number, value: string) => {
    const newSelections = { ...multiDimSelections, [dimensionIndex]: value };
    setMultiDimSelections(newSelections);

    const matchingVariation = findMatchingVariation(newSelections);
    if (matchingVariation) {
      setSelectedVariation(matchingVariation);
    }
  };

  const getCurrentPrice = () => {
    if (selectedVariation) {
      return selectedVariation.price;
    }
    return product.price;
  };

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

  const hasVariedPrices = () => {
    if (!product.variations || product.variations.length <= 1) {
      return false;
    }
    const prices = product.variations.map(v => v.price);
    return new Set(prices).size > 1;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation when clicking add to cart
    e.stopPropagation();
    setIsAdding(true);
    addToCart(product, 1, selectedVariation || undefined);

    // Reset button state after animation
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  const handleVariationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const variation = product.variations?.find(v => v.id === e.target.value);
    if (variation) {
      setSelectedVariation(variation);
    }
  };

  return (
    <Link href={`/products/${product.id}`} className="block h-full">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
        {/* Product Image */}
        <div className="relative h-48 bg-gray-100 flex-shrink-0">
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
      </div>

      {/* Product Info */}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        <p className="text-xs text-gray-600 mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.description}
        </p>

        {/* Variations Selector - Dynamic height container */}
        <div className="mb-2" style={{ minHeight: isMultiDimensional() ? '8rem' : '3.5rem' }}>
          {hasMultipleVariations && (
            <div onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}>
              {isMultiDimensional() ? (
                // Multi-dimensional variations - show two dropdowns
                <div className="space-y-1.5">
                  {getVariationDimensions().map((options, dimensionIndex) => (
                    <div key={dimensionIndex}>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        {dimensionIndex === 0 ? 'Scent' : 'Design'}
                      </label>
                      <select
                        value={multiDimSelections[dimensionIndex] || ''}
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMultiDimChange(dimensionIndex, e.target.value);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500 bg-white"
                      >
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                // Single-dimension variations - show one dropdown
                <>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Select Option
                  </label>
                  <select
                    value={selectedVariation?.id || ''}
                    onChange={handleVariationChange}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-sage-500 focus:border-sage-500 bg-white"
                  >
                    {product.variations!.map((variation) => (
                      <option key={variation.id} value={variation.id}>
                        {hasVariedPrices()
                          ? `${variation.name} - ${formatPrice(variation.price)}`
                          : variation.name
                        }
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}
        </div>

        {/* Price and Add to Cart - Push to bottom */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            <span className="text-xl font-bold text-gray-900">
              {hasMultipleVariations && selectedVariation
                ? formatPrice(getCurrentPrice())
                : getPriceDisplay()}
            </span>
            {hasMultipleVariations && !selectedVariation && (
              <p className="text-xs text-gray-500 mt-0.5">Multiple options</p>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || isAdding}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${
              product.inStock
                ? isAdding
                  ? 'bg-green-500 text-white'
                  : 'bg-sage-500 text-white hover:bg-sage-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAdding ? (
              <span className="flex items-center gap-1.5">
                <svg
                  className="animate-spin h-3 w-3"
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
    </Link>
  );
}
