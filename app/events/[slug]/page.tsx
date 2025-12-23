import Image from 'next/image';
import { getSiteConfig } from '@/lib/site-config';
import { notFound } from 'next/navigation';

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const config = getSiteConfig();
  const event = config.events;

  // Check if event exists and matches slug
  if (!event.active || event.slug !== slug) {
    notFound();
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px]">
        <Image
          src="/images/home-lavender-hero.jpg"
          alt={event.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-wide">
              {event.name}
            </h1>
            <p className="text-xl md:text-2xl text-white">
              {event.dates}
            </p>
          </div>
        </div>
      </section>

      {/* Event Details Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Event</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {event.shortDescription}
            </p>

            {/* Customize this section based on your event type */}
            <div className="bg-sage-50 p-8 rounded-lg mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h3>
              <ul className="space-y-3 text-gray-700">
                <li><strong>When:</strong> {event.dates}</li>
                <li><strong>Where:</strong> Olympic Bluffs Cidery & Lavender Farm</li>
                <li><strong>Admission:</strong> Free to the public</li>
                <li><strong>Activities:</strong> Farm tours, lavender picking, shopping, refreshments</li>
              </ul>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">What to Expect</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Join us for a special celebration at the farm! Experience the beauty of our lavender fields,
              browse our selection of handcrafted lavender products, and enjoy the peaceful atmosphere
              of the Olympic Peninsula.
            </p>

            <p className="text-gray-700 leading-relaxed">
              This is a wonderful opportunity to learn about lavender cultivation, meet our farmers,
              and take home some of our farm-fresh products. We look forward to seeing you there!
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-sage-500">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Plan Your Visit</h2>
          <p className="text-white text-lg mb-8">
            Mark your calendar and come experience the magic of Olympic Bluffs!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-white text-sage-700 px-8 py-3 rounded-md font-semibold hover:bg-sage-50 transition-colors"
            >
              Get Directions
            </a>
            <a
              href="/shop/lavender"
              className="bg-sage-700 text-white px-8 py-3 rounded-md font-semibold hover:bg-sage-800 transition-colors"
            >
              Shop Now
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
