import Image from 'next/image';
import SeasonalBanner from '@/components/SeasonalBanner';
import MeetOwners from '@/components/MeetOwners';
import { getSiteConfig } from '@/lib/site-config';

export default function Home() {
  const config = getSiteConfig();
  const farmStatus = config.seasonal.farmStatus;

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

      {/* Seasonal Banner - Controlled by config */}
      <SeasonalBanner />

      {/* Farm Status Information Section */}
      <section className="py-16 bg-sage-500">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-white text-center leading-relaxed mb-12">
            {!farmStatus.isOpen && (
              <>
                The Farm is closed for the season.<br />
                {config.seasonal.homePageMessage}<br /><br />
              </>
            )}
            {farmStatus.customMessage && (
              <>
                {farmStatus.customMessage}<br /><br />
              </>
            )}
            At Olympic Bluffs Cidery, we craft small-batch ciders that showcase the unique character of our orchard-grown apples.
            From pressing fresh apples to fermenting, aging, and bottling on-site, every step is guided by a commitment to quality and sustainability.
            With each bottle, our goal to capture the essence of our farm and the flavors of the Olympic Peninsula.
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
