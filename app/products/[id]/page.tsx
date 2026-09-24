'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariation } from '@/lib/types';
import { useCart } from '@/components/shop/CartProvider';
import ImageCarousel from '@/components/shop/ImageCarousel';

const PLACEHOLDER_IMAGE = '/images/products/placeholder-lavender.svg';

function formatPrice(cents: number) {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [multiDimSelections, setMultiDimSelections] = useState<Record<string, string>>({});
  const [hoveredVariationId, setHoveredVariationId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        // Lavender products only. Ciders live on VinoShipper and have their
        // own pages under /cider.
        const lavenderResponse = await fetch('/api/products/lavender');
        const lavenderData = await lavenderResponse.json();
        const lavenderProducts: Product[] = lavenderData.success ? lavenderData.products : [];
        const foundProduct = lavenderProducts.find((p) => p.id === params.id);

        if (!foundProduct) {
          setError('Product not found');
          return;
        }

        setProduct(foundProduct);
        if (foundProduct.variations && foundProduct.variations.length > 0) {
          setSelectedVariation(foundProduct.variations[0]);

          const hasMultiDim = foundProduct.variations.some((v) => v.name.includes(','));
          if (hasMultiDim) {
            const dimensionsMap: Record<number, Set<string>> = {};
            foundProduct.variations.forEach((variation) => {
              const parts = variation.name.split(',').map((p) => p.trim());
              parts.forEach((part, index) => {
                if (!dimensionsMap[index]) dimensionsMap[index] = new Set();
                dimensionsMap[index].add(part);
              });
            });

            const initialSelections: Record<string, string> = {};
            Object.keys(dimensionsMap).forEach((key) => {
              const index = parseInt(key);
              const options = Array.from(dimensionsMap[index]).sort();
              initialSelections[index] = options[0];
            });
            setMultiDimSelections(initialSelections);
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [params.id, router]);

  const getCurrentPrice = () => selectedVariation?.price ?? product?.price ?? 0;

  const getCurrentImage = () => {
    if (hoveredVariationId) {
      const hovered = product?.variations?.find((v) => v.id === hoveredVariationId);
      if (hovered?.image) return hovered.image;
    }
    if (selectedVariation?.image) return selectedVariation.image;
    return product?.image || PLACEHOLDER_IMAGE;
  };

  const isMultiDimensional = () => {
    if (!product?.variations || product.variations.length <= 1) return false;
    return product.variations.some((v) => v.name.includes(','));
  };

  const selectVariation = (variation: ProductVariation) => {
    setSelectedVariation(variation);
    if (isMultiDimensional()) {
      const parts = variation.name.split(',').map((p) => p.trim());
      const next: Record<string, string> = {};
      parts.forEach((part, index) => {
        next[index] = part;
      });
      setMultiDimSelections(next);
    }
  };

  const hasVariedPrices = () => {
    if (!product?.variations || product.variations.length <= 1) return false;
    return new Set(product.variations.map((v) => v.price)).size > 1;
  };

  const getVariationDimensions = () => {
    if (!product?.variations) return [];
    const dimensionsMap: Record<number, Set<string>> = {};
    product.variations.forEach((variation) => {
      const parts = variation.name.split(',').map((p) => p.trim());
      parts.forEach((part, index) => {
        if (!dimensionsMap[index]) dimensionsMap[index] = new Set();
        dimensionsMap[index].add(part);
      });
    });
    return Object.values(dimensionsMap).map((set) => Array.from(set).sort());
  };

  const findMatchingVariation = (selections: Record<string, string>) => {
    if (!product?.variations) return null;
    const selectionValues = Object.values(selections);
    if (selectionValues.some((v) => !v)) return null;
    const searchName = selectionValues.join(', ');
    return product.variations.find((v) => v.name === searchName) || null;
  };

  const handleMultiDimChange = (dimensionIndex: number, value: string) => {
    const newSelections = { ...multiDimSelections, [dimensionIndex]: value };
    setMultiDimSelections(newSelections);
    const matchingVariation = findMatchingVariation(newSelections);
    if (matchingVariation) setSelectedVariation(matchingVariation);
  };

  const handleAddToCart = () => {
    if (!product) return;
    setIsAdding(true);
    addToCart(product, quantity, selectedVariation || undefined);
    setTimeout(() => setIsAdding(false), 1000);
  };

  if (isLoading) {
    return (
      <section className="bg-ground py-24">
        <p className="text-center text-ink-3" role="status">
          Loading…
        </p>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="bg-ground py-24">
        <div className="container-x text-center">
          <h1 className="font-serif text-[clamp(28px,4vw,44px)]">{error || 'Product not found'}</h1>
          <Link href="/lavender" className="btn btn-primary mt-6">
            Back to the shop
          </Link>
        </div>
      </section>
    );
  }

  const variationsWithImages = (product.variations || []).filter((v) => v.image);
  const imageAlt = selectedVariation ? `${product.name}, ${selectedVariation.name}` : product.name;

  return (
    <section className="bg-ground py-12 sm:py-16">
      <div className="container-x">
        <nav className="mb-8 text-sm text-ink-3" aria-label="Breadcrumb">
          <Link href="/lavender" className="hover:text-ink">
            Lavender shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink-2">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Photos: variation gallery, carousel, or a single image */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {variationsWithImages.length > 0 ? (
              <div>
                <div className="relative aspect-square bg-ground-2">
                  <Image
                    key={getCurrentImage()}
                    src={getCurrentImage()}
                    alt={imageAlt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-contain p-6"
                    priority
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {variationsWithImages.map((variation) => {
                    const isSelected = selectedVariation?.id === variation.id;
                    return (
                      <button
                        key={variation.id}
                        type="button"
                        onMouseEnter={() => setHoveredVariationId(variation.id)}
                        onMouseLeave={() => setHoveredVariationId(null)}
                        onFocus={() => setHoveredVariationId(variation.id)}
                        onBlur={() => setHoveredVariationId(null)}
                        onClick={() => selectVariation(variation)}
                        aria-label={`Select ${variation.name}`}
                        aria-pressed={isSelected}
                        className={`relative h-16 w-16 overflow-hidden border transition-colors ${
                          isSelected ? 'border-ink' : 'border-line hover:border-ink-3'
                        }`}
                      >
                        <Image src={variation.image!} alt={variation.name} fill sizes="64px" className="object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : product.images && product.images.length > 0 ? (
              <ImageCarousel images={product.images} alt={imageAlt} />
            ) : (
              <div className="relative aspect-square bg-ground-2">
                <Image
                  key={getCurrentImage()}
                  src={getCurrentImage()}
                  alt={imageAlt}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-contain p-6"
                  priority
                />
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.category && <p className="eyebrow text-lav">{product.category}</p>}
            <h1 className="mt-2 font-serif text-[clamp(32px,4.5vw,52px)] leading-[1.02]">{product.name}</h1>
            <p className="mt-3 font-serif text-2xl">{formatPrice(getCurrentPrice())}</p>
            {!product.inStock && <p className="mt-1 text-sm text-ink-3">Sold out for now</p>}

            {product.description && (
              <p className="mt-6 text-[16px] leading-relaxed text-ink-2">{product.description}</p>
            )}
            {product.longDescription && (
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{product.longDescription}</p>
            )}

            {product.variations && product.variations.length > 1 && (
              <div className="mt-8 space-y-5">
                {isMultiDimensional() ? (
                  getVariationDimensions().map((options, dimensionIndex) => (
                    <div key={dimensionIndex}>
                      <label htmlFor={`dimension-${dimensionIndex}`} className="eyebrow block">
                        {dimensionIndex === 0 ? 'Scent' : 'Design'}
                      </label>
                      <select
                        id={`dimension-${dimensionIndex}`}
                        value={multiDimSelections[dimensionIndex] || ''}
                        onChange={(e) => handleMultiDimChange(dimensionIndex, e.target.value)}
                        className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-2.5 text-[15px] focus:border-ink focus:outline-none"
                      >
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                ) : (
                  <div>
                    <p className="eyebrow">Options</p>
                    <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Options">
                      {product.variations.map((variation) => {
                        const active = selectedVariation?.id === variation.id;
                        return (
                          <button
                            key={variation.id}
                            type="button"
                            onClick={() => setSelectedVariation(variation)}
                            aria-pressed={active}
                            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                              active ? 'border-ink bg-ink text-white' : 'border-line text-ink-2 hover:border-ink hover:text-ink'
                            }`}
                          >
                            {variation.name}
                            {hasVariedPrices() && <span className="ml-1.5 opacity-70">{formatPrice(variation.price)}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

                          <div className="mt-8">
                <p className="eyebrow">Quantity</p>
                <div className="mt-2 inline-flex items-center rounded-full border border-line bg-paper">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ground hover:text-ink disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    aria-label="Quantity"
                    className="w-12 bg-transparent text-center text-[15px] tabular-nums focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ground hover:text-ink"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!product.inStock || isAdding}
                className="btn btn-primary min-w-[10rem]"
              >
                {isAdding ? 'Added to cart' : product.inStock ? 'Add to cart' : 'Sold out'}
              </button>
              <Link href="/lavender" className="btn btn-secondary">
                Keep browsing
              </Link>
            </div>

                          <p className="mt-4 text-xs text-ink-3">
                Pickup at the farm is free. Shipping is added at checkout through Square.
              </p>
          </div>
        </div>
      </div>
    </section>
  );
}
