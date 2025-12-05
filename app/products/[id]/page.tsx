'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product, ProductVariation } from '@/lib/types';
import { useCart } from '@/components/shop/CartProvider';

// Cider descriptions - same as FeaturedCiderSection
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
const getDescriptions = (productName: string, originalDescription?: string): { left: string; right: string } | null => {
  // Normalize: lowercase and remove apostrophes/special chars
  const nameLower = productName.toLowerCase().replace(/['']/g, '');

  for (const [key, descriptions] of Object.entries(ciderDescriptions)) {
    const keyWithSpaces = key.replace(/-/g, ' ');
    const keyNoSpaces = key.replace(/-/g, '');

    if (nameLower.includes(keyWithSpaces) || nameLower.includes(keyNoSpaces)) {
      return descriptions;
    }
  }

  // Return null for non-cider products (will use different layout)
  return null;
};

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
        const [lavenderResponse, cideryResponse] = await Promise.all([
          fetch('/api/products/lavender'),
          fetch('/api/products/cidery'),
        ]);

        const lavenderData = await lavenderResponse.json();
        const cideryData = await cideryResponse.json();

        const allProducts = [
          ...(lavenderData.success ? lavenderData.products : []),
          ...(cideryData.success ? cideryData.products : []),
        ];

        const foundProduct = allProducts.find((p: Product) => p.id === params.id);

        if (foundProduct) {
          setProduct(foundProduct);
          if (foundProduct.variations && foundProduct.variations.length > 0) {
            setSelectedVariation(foundProduct.variations[0]);

            const hasMultiDim = foundProduct.variations.some((v: any) => v.name.includes(','));
            if (hasMultiDim) {
              const dimensionsMap: Record<number, Set<string>> = {};
              foundProduct.variations.forEach((variation: any) => {
                const parts = variation.name.split(',').map((p: string) => p.trim());
                parts.forEach((part: string, index: number) => {
                  if (!dimensionsMap[index]) {
                    dimensionsMap[index] = new Set();
                  }
                  dimensionsMap[index].add(part);
                });
              });

              const initialSelections: Record<string, string> = {};
              Object.keys(dimensionsMap).forEach((key: string) => {
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
    if (selectedVariation?.image) {
      return selectedVariation.image;
    }
    return product?.image || '/images/products/placeholder-lavender.svg';
  };

  const hasVariedPrices = () => {
    if (!product?.variations || product.variations.length <= 1) {
      return false;
    }
    const prices = product.variations.map((v: any) => v.price);
    return new Set(prices).size > 1;
  };

  const isMultiDimensional = () => {
    if (!product?.variations || product.variations.length <= 1) {
      return false;
    }
    return product.variations.some((v: any) => v.name.includes(','));
  };

  const getVariationDimensions = () => {
    if (!product?.variations) return [];

    const dimensionsMap: Record<number, Set<string>> = {};

    product.variations.forEach((variation: any) => {
      const parts = variation.name.split(',').map((p: string) => p.trim());
      parts.forEach((part: string, index: number) => {
        if (!dimensionsMap[index]) {
          dimensionsMap[index] = new Set();
        }
        dimensionsMap[index].add(part);
      });
    });

    return Object.values(dimensionsMap).map((set: Set<string>) => Array.from(set).sort());
  };

  const findMatchingVariation = (selections: Record<string, string>) => {
    if (!product?.variations) return null;

    const selectionValues = Object.values(selections);
    if (selectionValues.some((v: string) => !v)) return null;

    const searchName = selectionValues.join(', ');
    return product.variations.find((v: any) => v.name === searchName) || null;
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-sage-50/30">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sage-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-sage-50/30">
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

  // Check if this is a cider product with custom descriptions
  const descriptions = getDescriptions(product.name, product.description);
  const isCiderProduct = descriptions !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sage-50/30 to-sage-50/50">
      {/* Breadcrumbs */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Product Title - Centered */}
        <div className="text-center mb-8 lg:mb-12">
          {product.category && (
            <div className="mb-3">
              <span className="text-sm text-sage-600 font-medium uppercase tracking-wide">
                {product.category}
              </span>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            {product.name}
          </h1>
          <div className="flex justify-center">
            <div className="w-24 h-0.5 bg-sage-400 rounded-full" />
          </div>
        </div>

        {/* Three Column Layout for Cider / Centered for Lavender */}
        {isCiderProduct ? (
          // Cider Product - Three Column Layout
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center mb-12">
            {/* Left - Generated Description */}
            <div className="order-2 lg:order-1 text-center lg:text-right">
              <p className="text-lg text-gray-700 leading-relaxed">
                {descriptions.left}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-4">
                {descriptions.right}
              </p>
            </div>

            {/* Center - Product Image */}
            <div className="order-1 lg:order-2 relative h-[400px] sm:h-[500px] lg:h-[550px]">
              <Image
                key={getCurrentImage()}
                src={getCurrentImage()}
                alt={selectedVariation ? `${product.name} - ${selectedVariation.name}` : product.name}
                fill
                sizes="(min-width: 1024px) 400px, (min-width: 640px) 350px, 280px"
                className="object-contain drop-shadow-2xl"
                priority
              />
              {!product.inStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold text-lg">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Right - Square Product Info */}
            <div className="order-3 text-center lg:text-left space-y-6">
              {/* Product Details from Square */}
              <div className="space-y-4">
                {product.volume && (
                  <div>
                    <span className="text-sm text-gray-500 uppercase tracking-wide">Volume</span>
                    <p className="text-xl font-semibold text-gray-900">{product.volume}</p>
                  </div>
                )}
                {product.abv && (
                  <div>
                    <span className="text-sm text-gray-500 uppercase tracking-wide">ABV</span>
                    <p className="text-xl font-semibold text-gray-900">{product.abv}</p>
                  </div>
                )}
                {product.ciderType && (
                  <div>
                    <span className="text-sm text-gray-500 uppercase tracking-wide">Style</span>
                    <p className="text-xl font-semibold text-gray-900">{product.ciderType}</p>
                  </div>
                )}
              </div>
              {/* Original Square Description */}
              {product.description && (
                <div>
                  <span className="text-sm text-gray-500 uppercase tracking-wide">From the Maker</span>
                  <p className="text-base text-gray-600 leading-relaxed mt-1">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Lavender Product - Centered Image with Description Below
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative h-[350px] sm:h-[450px] mb-8">
              <Image
                key={getCurrentImage()}
                src={getCurrentImage()}
                alt={selectedVariation ? `${product.name} - ${selectedVariation.name}` : product.name}
                fill
                sizes="(min-width: 1024px) 500px, (min-width: 640px) 400px, 300px"
                className="object-contain drop-shadow-xl"
                priority
              />
              {!product.inStock && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold text-lg">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>
            {product.description && (
              <p className="text-lg text-gray-700 leading-relaxed text-center max-w-2xl mx-auto">
                {product.description}
              </p>
            )}
          </div>
        )}

        {/* Bottom Section - Centered */}
        <div className="max-w-xl mx-auto text-center">
          {/* Price */}
          <div className="text-4xl sm:text-5xl font-bold text-sage-600 mb-8">
            {formatPrice(getCurrentPrice())}
          </div>

          {/* Variations */}
          {product.variations && product.variations.length > 1 && (
            <div className="mb-8">
              {isMultiDimensional() ? (
                <div className="space-y-4">
                  {getVariationDimensions().map((options: string[], dimensionIndex: number) => (
                    <div key={dimensionIndex}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {dimensionIndex === 0 ? 'Select Scent' : 'Select Design'}
                      </label>
                      <select
                        value={multiDimSelections[dimensionIndex] || ''}
                        onChange={(e) => handleMultiDimChange(dimensionIndex, e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sage-500 focus:ring-2 focus:ring-sage-200 transition-all"
                      >
                        {options.map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Option
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {product.variations.map((variation: any) => (
                      <button
                        key={variation.id}
                        onClick={() => setSelectedVariation(variation)}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
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
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quantity
            </label>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 rounded-md border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                disabled={quantity <= 1}
              >
                <span className="text-xl">−</span>
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 h-12 text-center text-lg font-medium border-2 border-gray-200 rounded-md"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 rounded-md border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl">+</span>
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || isAdding}
            className={`w-full max-w-sm mx-auto py-4 px-8 rounded-md font-semibold text-lg shadow-lg transition-all duration-300 ${
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
            className="w-full max-w-sm mx-auto mt-4 py-3 px-6 rounded-md font-medium text-sage-600 border-2 border-sage-500 hover:bg-sage-50 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
