import Hero from '@/components/Hero';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Hero
        title="Olympic Bluffs Cidery"
        subtitle="Crafting premium ciders with passion and tradition"
        height="large"
      />

      {/* Welcome Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Welcome to Olympic Bluffs Cidery
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Nestled in the beautiful Pacific Northwest, we craft exceptional hard ciders
              using locally sourced apples and time-honored traditions. Each bottle tells
              a story of our region&apos;s rich agricultural heritage.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-amber-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Signature Ciders
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                name: 'Classic Dry',
                description: 'Crisp and refreshing with a perfect balance of tartness and sweetness',
              },
              {
                name: 'Honey Crisp',
                description: 'Sweet and aromatic with notes of local honey and fresh apples',
              },
              {
                name: 'Barrel Aged',
                description: 'Complex and refined, aged in oak barrels for a unique depth of flavor',
              },
            ].map((cider) => (
              <div
                key={cider.name}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-amber-200 to-amber-400 rounded-md mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {cider.name}
                </h3>
                <p className="text-gray-600">{cider.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-block bg-amber-700 text-white px-8 py-3 rounded-md font-semibold hover:bg-amber-800 transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Visit Us Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Visit Our Tasting Room
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Experience our ciders in our welcoming tasting room. Located in the heart
                of Port Townsend, we offer tastings, tours, and a space to relax and enjoy
                the flavors of the Pacific Northwest.
              </p>
              <div className="space-y-3 text-gray-700">
                <p><strong>Hours:</strong></p>
                <p>Thursday - Sunday: 12pm - 6pm</p>
                <p>Monday - Wednesday: Closed</p>
              </div>
              <Link
                href="/contact"
                className="inline-block mt-6 bg-amber-700 text-white px-6 py-3 rounded-md font-semibold hover:bg-amber-800 transition-colors"
              >
                Get Directions
              </Link>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-amber-300 rounded-lg h-96" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-amber-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Taste the Difference?
          </h2>
          <p className="text-xl mb-8 text-amber-100">
            Join us for a tasting experience you won&apos;t forget
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-amber-900 px-8 py-3 rounded-md font-semibold hover:bg-amber-50 transition-colors"
          >
            Plan Your Visit
          </Link>
        </div>
      </section>
    </>
  );
}
