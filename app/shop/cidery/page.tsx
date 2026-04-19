'use client';

import { useEffect } from 'react';

interface VinoshipperApi {
  init: (id: number, options: { cartPosition: string; cartButton: boolean }) => void;
  cartOpen?: () => void;
}

export default function CideryShopPage() {
  useEffect(() => {
    // Initialize VinoShipper injector
    const handleLoaded = () => {
      const vs = (window as unknown as { Vinoshipper?: VinoshipperApi }).Vinoshipper;
      if (vs) {
        vs.init(5980, {
          cartPosition: 'end',
          cartButton: false,
        });
      }
    };

    document.addEventListener('vinoshipper:loaded', handleLoaded, false);

    // Load VinoShipper script if not already present
    if (!document.querySelector('script[src*="vinoshipper.com/injector"]')) {
      const script = document.createElement('script');
      script.src = 'https://vinoshipper.com/injector/index.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      document.removeEventListener('vinoshipper:loaded', handleLoaded);
      // Hide VinoShipper cart button when leaving the cidery page
      const vsElements = document.querySelectorAll('[class*="vs-cart"], [class*="vs-button"], .vs-cart-button');
      vsElements.forEach(el => (el as HTMLElement).style.display = 'none');
    };
  }, []);

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

      {/* Info Banner */}
      <div className="bg-sage-50 border-y border-sage-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 text-center">
          <p className="text-sage-800 text-sm">
            Cider orders are handled separately from our lavender shop. Pickup at the farm and shipping to select states available below.
          </p>
        </div>
      </div>

      {/* VinoShipper Product Catalog */}
      <section className="py-16 bg-gradient-to-b from-white to-sage-50/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="vs-products" data-vs-cards="true"></div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-sage-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 text-center">
            <div>
              <div className="flex justify-center mb-4">
                <svg className="h-12 w-12 text-sage-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Small Batch Crafted</h3>
              <p className="text-gray-700">
                Each cider is carefully crafted in small batches to ensure exceptional quality and flavor.
              </p>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <svg className="h-12 w-12 text-sage-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Local Ingredients</h3>
              <p className="text-gray-700">
                Made with Washington-grown apples and ingredients from the Olympic Peninsula.
              </p>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <svg className="h-12 w-12 text-sage-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pickup & Shipping</h3>
              <p className="text-gray-700">
                Pick up at the farm or ship to your door. Age verification required for all orders.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
