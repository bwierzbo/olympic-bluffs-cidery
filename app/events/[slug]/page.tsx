import Image from 'next/image';
import { getSiteConfig } from '@/lib/site-config';
import { notFound } from 'next/navigation';
import LavenderFestival from '@/components/LavenderFestival';

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
      <LavenderFestival />

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
