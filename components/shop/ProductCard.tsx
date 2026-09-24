'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Product } from '@/lib/types';
import { useCart } from './CartProvider';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const PLACEHOLDER_IMAGE = '/images/products/placeholder-lavender.svg';

// Card images render at ~25vw on large screens (4-col grid) down to half
// width on mobile. Telling next/image the true display size stops it fetching
// oversized files.
const CARD_SIZES = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';

function formatPrice(cents: number) {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  // Track main-image load so we can show a shimmer while it arrives and fall
  // back to the placeholder if it fails, instead of leaving a blank card.
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(product.image || PLACEHOLDER_IMAGE);

  const hasMultipleVariations = Boolean(product.variations && product.variations.length > 1);

  const priceDisplay = (() => {
    if (!hasMultipleVariations) return formatPrice(product.price);
    const prices = product.variations!.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatPrice(min) : `${formatPrice(min)}–${formatPrice(max)}`;
  })();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    const variationToAdd =
      product.variations && product.variations.length === 1 ? product.variations[0] : undefined;
    addToCart(product, 1, variationToAdd);
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Square photo with hover crossfade */}
      <div className="relative aspect-square overflow-hidden bg-ground-2">
        {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-ground-2" aria-hidden="true" />}

        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes={CARD_SIZES}
          quality={65}
          priority={priority}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (imageSrc !== PLACEHOLDER_IMAGE) {
              setImageSrc(PLACEHOLDER_IMAGE);
            } else {
              setImageLoaded(true);
            }
          }}
          className={`object-cover transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${
            isHovered && product.hoverImage ? '!opacity-0 scale-105' : 'scale-100'
          } ${isHovered && !product.hoverImage ? 'scale-[1.03]' : ''}`}
        />

        {product.hoverImage && (
          <Image
            src={product.hoverImage}
            alt={`${product.name} in use`}
            fill
            sizes={CARD_SIZES}
            quality={65}
            className={`absolute inset-0 object-cover transition-all duration-300 ${
              isHovered ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
          />
        )}

        {product.inStock && (
          <div
            className={`absolute inset-x-0 bottom-0 flex justify-center pb-4 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              type="button"
              onClick={hasMultipleVariations ? undefined : handleAddToCart}
              tabIndex={-1}
              className="btn btn-onphoto shadow-sm"
            >
              {isAdding ? 'Added' : hasMultipleVariations ? 'Customize' : 'Add to cart'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="font-serif text-lg leading-snug">{product.name}</h3>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <p className="text-sm text-ink-2">{priceDisplay}</p>
          {!product.inStock && <p className="text-xs text-ink-3">Sold out</p>}
        </div>
        {product.category && (
          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-3">{product.category}</p>
        )}
      </div>
    </Link>
  );
}
