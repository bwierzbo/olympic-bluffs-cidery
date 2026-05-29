import type { Metadata } from 'next';
import Link from 'next/link';
import { getSiteConfig } from '@/lib/site-config';
import CideryShopClient from './CideryShopClient';

// Conditionally noindex the page so search engines drop /shop/cidery from
// results while showCidery is off. Returning noindex/nofollow on the server
// — before any client code runs — also means the page's real content never
// renders in HTML for crawlers to scrape, even if they ignore the meta.
export async function generateMetadata(): Promise<Metadata> {
  const showCidery = getSiteConfig().navigation.showCidery;
  return {
    title: 'Cidery Shop · Olympic Bluffs',
    robots: showCidery ? undefined : { index: false, follow: false },
  };
}

export default function CideryShopPage() {
  const showCidery = getSiteConfig().navigation.showCidery;

  if (!showCidery) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-sage-50">
        <section className="bg-sage-500 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Coming Soon
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Our online cider shop is being prepared. Check back soon to browse and purchase our small-batch ciders!
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-white text-sage-700 rounded-md font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                About Our Cidery
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Olympic Bluffs Cidery crafts small-batch ciders that showcase the unique character of our orchard-grown apples. From pressing fresh fruit to fermenting, aging, and bottling on-site, every step is guided by quality and sustainability.
              </p>
              <p className="text-lg text-gray-700">
                Our online cider shop will be available soon. In the meantime, visit us at the farm!
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return <CideryShopClient />;
}
