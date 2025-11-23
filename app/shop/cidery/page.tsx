'use client';

import { useState, useMemo, useEffect } from 'react';
import CiderCard from '@/components/shop/CiderCard';
import { Product } from '@/lib/types';
import Link from 'next/link';

export default function CideryShopPage() {
  // Show "Coming Soon" page in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-sage-50">
        {/* Hero Section */}
        <section className="bg-sage-500 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Coming Soon
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Our online cidery shop is currently being prepared. Check back soon to browse and purchase our handcrafted ciders!
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-white text-sage-700 rounded-md font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                About Our Ciders
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                At Olympic Bluffs Cidery, we craft small-batch ciders using Washington-grown apples and ingredients from the Olympic Peninsula. Each cider is carefully made to bring out the natural flavors of the fruit.
              </p>
              <p className="text-lg text-gray-700">
                Our online shop will be available soon. In the meantime, visit us in person or check out our lavender products!
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch cider products from Square on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products/cidery');
        const data = await response.json();

        if (data.success) {
          setProducts(data.products);
        } else {
          setError(data.error || 'Failed to load ciders');
        }
      } catch (err) {
        console.error('Error fetching ciders:', err);
        setError('Failed to load ciders. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [searchTerm, products]);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-sage-500 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Shop Our Ciders
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-6">
            Handcrafted ciders from Olympic Bluffs Cidery. Each batch is carefully
            crafted to bring out the natural flavors of Washington apples.
          </p>
          <div className="flex justify-center gap-4 text-white/80 text-sm">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Small Batch
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Local Apples
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Must be 21+
            </span>
          </div>
        </div>
      </section>

      {/* Age Verification Banner */}
      <div className="bg-sage-50 border-y border-sage-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 text-center">
          <p className="text-sage-900 font-medium">
            🔞 You must be 21 or older to purchase cider products. Please drink responsibly.
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-16 bg-gradient-to-b from-white to-sage-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sage-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading ciders...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* Products Content */}
          {!isLoading && !error && (
            <div>
                {/* Search Bar */}
              <div className="mb-8">
                <div className="relative max-w-md mx-auto">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search ciders..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-sage-500 focus:border-sage-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <p className="mt-2 text-sm text-gray-600 text-center">
                    {filteredProducts.length} cider{filteredProducts.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>

              {/* No Results Message */}
              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No ciders found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm ? "Try adjusting your search." : "Check back soon for new releases!"}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sage-600 hover:bg-sage-700"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}

              {/* All Ciders */}
              {filteredProducts.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    {searchTerm ? 'Search Results' : 'Our Ciders'}
                  </h2>
                  <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((product) => (
                      <CiderCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-sage-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 text-center">
            <div>
              <div className="flex justify-center mb-4">
                <svg
                  className="h-12 w-12 text-sage-700"
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
                Small Batch Crafted
              </h3>
              <p className="text-gray-700">
                Each cider is carefully crafted in small batches to ensure
                exceptional quality and flavor.
              </p>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <svg
                  className="h-12 w-12 text-sage-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Local Ingredients
              </h3>
              <p className="text-gray-700">
                Made with Washington-grown apples and ingredients from the
                Olympic Peninsula.
              </p>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <svg
                  className="h-12 w-12 text-sage-700"
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
                Pickup & Shipping
              </h3>
              <p className="text-gray-700">
                Choose local pickup at the cidery or have your order shipped
                directly to you (where legal).
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
