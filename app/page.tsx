import Image from 'next/image';
import SeasonalBanner from '@/components/SeasonalBanner';
import MeetOwners from '@/components/MeetOwners';

export default function Home() {
  return (
    <>
      {/* Hero Section with Background Image */}
      <section className="relative h-[500px] md:h-[600px]">
        <Image
          src="/images/home-lavender-hero.jpg"
          alt="Lavender farm"
          fill
          className="object-cover"
          priority
        />
        {/* White Overlay Box */}
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="bg-white p-8 md:p-12 max-w-2xl text-center shadow-xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-wide">
              WELCOME
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-2">
              to the farm
            </p>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Graded between the Olympic Mountain Range and the Strait of Juan De Fuca, the Sequim Valley and Lavender
              form the northwest area of the exiting 8 mountains.
            </p>
          </div>
        </div>
      </section>

      {/* Seasonal Banner - Toggle isVisible to show/hide */}
      <SeasonalBanner isVisible={true} />

      {/* Farm Closed Information Section */}
      <section className="py-16 bg-sage-500">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-white text-center leading-relaxed mb-12">
            During the Winter season the farm will be closed getting ready for the new growing season.<br /><br />
            You can still buy cider, lavender products and merchandise at Sal&apos;s in Raymound, Ilwaco.<br /><br />
            So please follow us on our social media for your next visit or email us at{' '}
            <a href="mailto:scottatobcf@gmail.com" className="underline hover:text-sage-100">
              scottatobcf@gmail.com
            </a> and{' '}
            <a href="mailto:gingeratobcf@gmail.com" className="underline hover:text-sage-100">
              gingeratobcf@gmail.com
            </a>.
            Come and join us! Products can be purchased online via Shipping Fresh apples to making ciders with our own apples fresh apple juice,
            and bottling our first ciders both dry and hard we are guided by a love of crafting and building our business in beautiful Olympic
            Peninsula-more about our products and services.
          </p>

          {/* Farm Building Image */}
          <div className="relative h-[300px] md:h-[500px] border-8 border-sage-400">
            <Image
              src="/images/home-cidery-building.jpeg"
              alt="Olympic Bluffs Cidery building"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Meet Scott & Ginger Section */}
      <MeetOwners />
    </>
  );
}
