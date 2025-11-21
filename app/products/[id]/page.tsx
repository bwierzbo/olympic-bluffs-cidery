'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product, ProductVariation } from '@/lib/types';
import { useCart } from '@/components/shop/CartProvider';

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

  useEffect(() => {
    async function fetchProduct() {
      try {
        // Try both lavender and cidery endpoints to find the product
        const [lavenderResponse, cideryResponse] = await Promise.all([
          fetch('/api/products/lavender'),
          fetch('/api/products/cidery'),
        ]);

        const lavenderData = await lavenderResponse.json();
        const cideryData = await cideryResponse.json();

        // Combine all products
        const allProducts = [
          ...(lavenderData.success ? lavenderData.products : []),
          ...(cideryData.success ? cideryData.products : []),
        ];

        // Find the product by ID
        const foundProduct = allProducts.find((p: Product) => p.id === params.id);

        if (foundProduct) {
          setProduct(foundProduct);
          // Auto-select first variation if available
          if (foundProduct.variations && foundProduct.variations.length > 0) {
            setSelectedVariation(foundProduct.variations[0]);

            // If multi-dimensional, initialize selections with first options
            const hasMultiDim = foundProduct.variations.some(v => v.name.includes(','));
            if (hasMultiDim) {
              const dimensionsMap: Record<number, Set<string>> = {};
              foundProduct.variations.forEach(variation => {
                const parts = variation.name.split(',').map(p => p.trim());
                parts.forEach((part, index) => {
                  if (!dimensionsMap[index]) {
                    dimensionsMap[index] = new Set();
                  }
                  dimensionsMap[index].add(part);
                });
              });

              const initialSelections: Record<string, string> = {};
              Object.keys(dimensionsMap).forEach(key => {
                const index = parseInt(key);
                const options = Array.from(dimensionsMap[index]).sort();
                initialSelections[index] = options[0];
              });

              setMultiDimSelections(initialSelections);
            }
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [params.id]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getCurrentPrice = () => {
    if (selectedVariation) {
      return selectedVariation.price;
    }
    return product?.price || 0;
  };

  const getCurrentImage = () => {
    // Use variation image if selected and available
    if (selectedVariation?.image) {
      return selectedVariation.image;
    }
    // Otherwise use product image
    return product?.image || '/images/products/placeholder-lavender.svg';
  };

  const hasVariedPrices = () => {
    if (!product?.variations || product.variations.length <= 1) {
      return false;
    }
    const prices = product.variations.map(v => v.price);
    return new Set(prices).size > 1;
  };

  // Check if variations have multiple dimensions (comma-separated)
  const isMultiDimensional = () => {
    if (!product?.variations || product.variations.length <= 1) {
      return false;
    }
    return product.variations.some(v => v.name.includes(','));
  };

  // Parse multi-dimensional variations into separate dimension options
  const getVariationDimensions = () => {
    if (!product?.variations) return [];

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
    if (!product?.variations) return null;

    const selectionValues = Object.values(selections);
    if (selectionValues.some(v => !v)) return null; // Not all dimensions selected

    const searchName = selectionValues.join(', ');
    return product.variations.find(v => v.name === searchName) || null;
  };

  // Handle multi-dimensional selection change
  const handleMultiDimChange = (dimensionIndex: number, value: string) => {
    const newSelections = { ...multiDimSelections, [dimensionIndex]: value };
    setMultiDimSelections(newSelections);

    const matchingVariation = findMatchingVariation(newSelections);
    if (matchingVariation) {
      setSelectedVariation(matchingVariation);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    setIsAdding(true);
    addToCart(product, quantity, selectedVariation || undefined);

    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sage-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Product not found'}
          </h1>
          <button
            onClick={() => router.push('/shop/lavender')}
            className="px-6 py-3 bg-sage-500 text-white rounded-md hover:bg-sage-600"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push('/')}
              className="text-sage-600 hover:text-sage-700"
            >
              Home
            </button>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => router.back()}
              className="text-sage-600 hover:text-sage-700"
            >
              Shop
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative aspect-square bg-white rounded-lg overflow-hidden">
            <Image
              key={getCurrentImage()} // Force re-render when image changes
              src={getCurrentImage()}
              alt={selectedVariation ? `${product.name} - ${selectedVariation.name}` : product.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain transition-opacity duration-300"
              priority
            />
            {!product.inStock && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold text-lg">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Category */}
            {product.category && (
              <div className="mb-4">
                <span className="text-sm text-sage-600 font-medium">
                  {product.category}
                </span>
              </div>
            )}

            {/* Product Name */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(getCurrentPrice())}
              </span>
            </div>

            {/* Description with Volume and ABV */}
            <div className="mb-6">
              <p className="text-gray-600">
                {product.description}
                {product.volume && (
                  <span> | {product.volume}</span>
                )}
                {product.abv && (
                  <span> | {product.abv} ABV</span>
                )}
              </p>
            </div>

            {/* Variations */}
            {product.variations && product.variations.length > 1 && (
              <div className="mb-6">
                {isMultiDimensional() ? (
                  // Multi-dimensional variations - show separate dropdowns
                  <div className="space-y-4">
                    {getVariationDimensions().map((options, dimensionIndex) => (
                      <div key={dimensionIndex}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {dimensionIndex === 0 ? 'Select Scent' : 'Select Design'}
                        </label>
                        <select
                          value={multiDimSelections[dimensionIndex] || ''}
                          onChange={(e) => handleMultiDimChange(dimensionIndex, e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sage-500 focus:ring-2 focus:ring-sage-200 transition-all"
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
                  // Single-dimension variations - show button grid
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Option
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {product.variations.map((variation) => (
                        <button
                          key={variation.id}
                          onClick={() => setSelectedVariation(variation)}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            selectedVariation?.id === variation.id
                              ? 'border-sage-500 bg-sage-50'
                              : 'border-gray-200 hover:border-sage-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900">{variation.name}</div>
                          {hasVariedPrices() && (
                            <div className="text-sm text-gray-600 mt-1">
                              {formatPrice(variation.price)}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  disabled={quantity <= 1}
                >
                  <span className="text-xl">−</span>
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-10 text-center border border-gray-300 rounded-md"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  <span className="text-xl">+</span>
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || isAdding}
              className={`w-full py-4 px-6 rounded-md font-semibold text-lg transition-all duration-300 ${
                product.inStock
                  ? isAdding
                    ? 'bg-green-500 text-white'
                    : 'bg-sage-500 text-white hover:bg-sage-600'
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
                  Added to Cart!
                </span>
              ) : product.inStock ? (
                'Add to Cart'
              ) : (
                'Out of Stock'
              )}
            </button>

            {/* Continue Shopping Link */}
            <button
              onClick={() => router.back()}
              className="w-full mt-4 py-3 px-6 rounded-md font-medium text-sage-600 border-2 border-sage-500 hover:bg-sage-50 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
