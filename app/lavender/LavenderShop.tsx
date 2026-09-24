'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import FilterPills from '@/components/site/FilterPills';
import { Product } from '@/lib/types';

/**
 * The lavender product grid. Products come from Square via
 * /api/products/lavender; category and search filtering happen here.
 */
export default function LavenderShop() {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products/lavender');
        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
        } else {
          setError(data.error || 'Failed to load products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))
    ).sort();
    return [{ value: 'all', label: 'Everything' }, ...categories.map((c) => ({ value: c, label: c }))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === activeCategory);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.category?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [searchTerm, products, activeCategory]);

  return (
    <section className="py-12 sm:py-14">
      <div className="container-x">
        {isLoading && (
          <p className="py-12 text-center text-ink-3" role="status">
            Loading the shelves…
          </p>
        )}

        {error && !isLoading && (
          <div className="border border-line bg-paper px-4 py-3 text-sm text-ink" role="alert">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <FilterPills
                options={categoryOptions}
                value={activeCategory}
                onChange={setActiveCategory}
                label="Filter by category"
              />
              <div className="relative w-full sm:w-64">
                <label htmlFor="lavender-search" className="sr-only">
                  Search products
                </label>
                <input
                  id="lavender-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="w-full rounded-full border border-line bg-paper px-4 py-1.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {searchTerm && (
              <p className="mb-6 text-sm text-ink-3">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} for “{searchTerm}”
              </p>
            )}

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-serif text-2xl">Nothing matches</p>
                <p className="mt-2 text-sm text-ink-3">Try another word, or clear the search.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory('all');
                  }}
                  className="btn btn-secondary mt-5"
                >
                  Show everything
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 6} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
