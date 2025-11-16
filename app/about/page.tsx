import Image from 'next/image';

export default function About() {
  return (
    <>
      {/* Meet Scott & Ginger Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 tracking-wide text-center">
            MEET SCOTT & GINGER
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Text Content - Left */}
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <p>
                In 2015, we visited the Olympic Peninsula for the first time during the annual lavender festival and immediately fell in love with the beauty of the land and the spirit of the community. In 2020, we made the peninsula our full-time home.
              </p>
              <p>
                We are both US Air Force veterans and have been stationed all around the world. Each new assignment brought new experiences and new people. We learned quickly making new friends and building relationships in small communities.
              </p>
              <p>
                With the goal of creating great cider and the desire to bring our community together, we decided to start a hard cidery and lavender farm. We have planted an orchard of 480 Semi-dwarf cider apple trees, 3,400 lavender plants, an apiary and an acre of ancient grains wheat and rye. In November 2024, we added Salt and Cedar Bed and Breakfast.
              </p>
              <p>
                We&apos;re excited about being a part of the community and sharing this beautiful destination with you.
              </p>
            </div>

            {/* Image - Right */}
            <div className="relative h-[400px] lg:h-[500px]">
              <Image
                src="/images/team/aboutus.jpeg"
                alt="Scott and Ginger"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
