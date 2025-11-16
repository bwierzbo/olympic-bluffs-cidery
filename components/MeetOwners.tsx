import Image from 'next/image';
import Link from 'next/link';

interface MeetOwnersProps {
  imagePath?: string;
  title?: string;
  description?: string;
}

export default function MeetOwners({
  imagePath = '/images/home-owners.jpeg',
  title = 'MEET SCOTT & GINGER',
  description = `With the goal of creating great cider and like always so loving our lavender farm. We have planted an orchard of almost 200 Semi Dwarf apples planted in 2015, 5,500 lavender plants, an apiary and an American Chestnut grove all on 25 acres just outside of Sequim and Cedar Bell and Breakfast on on JR Jays Farm.\n\nWe're excited about being a part of the communauty and sharing our passion.`
}: MeetOwnersProps) {
  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="order-2 md:order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-wide">
              {title}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-8 whitespace-pre-line">
              {description}
            </p>
            <Link
              href="/about"
              className="inline-block bg-sage-500 text-white px-8 py-3 rounded-md hover:bg-sage-600 transition-colors text-sm font-medium tracking-wide"
            >
              ABOUT US
            </Link>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2">
            <div className="relative h-[400px] md:h-[500px]">
              <Image
                src={imagePath}
                alt="Scott and Ginger"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
