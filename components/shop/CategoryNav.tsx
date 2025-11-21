'use client';

import { useState } from 'react';

interface CategoryNavProps {
  categories: string[];
  activeCategory: string | null;
  onCategoryClick: (category: string | null) => void;
}

export default function CategoryNav({ categories, activeCategory, onCategoryClick }: CategoryNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-sage-500 text-white rounded-md font-medium"
        >
          <span>Categories</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`lg:block ${isOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-20">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
          <nav className="space-y-2">
            {/* All Products */}
            <button
              onClick={() => {
                onCategoryClick(null);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeCategory === null
                  ? 'bg-sage-500 text-white font-medium'
                  : 'text-gray-700 hover:bg-sage-50'
              }`}
            >
              All Products
            </button>

            {/* Category List */}
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  onCategoryClick(category);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                  activeCategory === category
                    ? 'bg-sage-500 text-white font-medium'
                    : 'text-gray-700 hover:bg-sage-50'
                }`}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
