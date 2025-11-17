import ProductCard from '@/components/shop/ProductCard';
import products from '@/data/products.json';
import { Product } from '@/lib/types';

export default function ProductsPage() {
  const typedProducts = products as Product[];

  // Group products by category
  const categories = Array.from(
    new Set(typedProducts.map((p) => p.category).filter(Boolean))
  );

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-sage-500 to-sage-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Shop Our Products
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Handcrafted lavender products from our farm on the Olympic Peninsula.
            From skincare to home goods, each item is made with care and our own
            farm-grown lavender.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* All Products */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              All Products
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {typedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>

          {/* Products by Category */}
          {categories.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Shop by Category
              </h2>
              {categories.map((category) => {
                const categoryProducts = typedProducts.filter(
                  (p) => p.category === category
                );
                return (
                  <div key={category} className="mb-12">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {categoryProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-sage-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 text-center">
            <div>
              <div className="flex justify-center mb-4">
                <svg
                  className="h-12 w-12 text-sage-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Farm-Grown Lavender
              </h3>
              <p className="text-gray-600">
                All our lavender products feature lavender grown right here on our
                21-acre farm.
              </p>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <svg
                  className="h-12 w-12 text-sage-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Handcrafted with Care
              </h3>
              <p className="text-gray-600">
                Each product is carefully made in small batches to ensure the highest
                quality.
              </p>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <svg
                  className="h-12 w-12 text-sage-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Pickup & Shipping Available
              </h3>
              <p className="text-gray-600">
                Choose local pickup at the farm or have your order shipped directly to
                you.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
