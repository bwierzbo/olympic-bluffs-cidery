import Link from 'next/link';
import Image from 'next/image';
import buildingImage from '@/public/images/saltandcedar/building.jpeg';
import chairsImage from '@/public/images/saltandcedar/chairs.jpg';

export default function SaltCedarBnB() {
  return (
    <>
      {/* Hero Section with Building */}
      <section className="relative h-[400px] md:h-[500px] bg-gray-200">
        <img
          src="/images/saltandcedar/building.jpeg"
          alt="Salt & Cedar Bed and Breakfast"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      </section>

      {/* Welcome Text Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-700 leading-relaxed mb-8">
            Nestled on the scenic high bluffs just east of Port Angeles, Washington, our Bed & Breakfast boasts breathtaking 360-degree views of the majestic Olympic Mountain Range and the Strait of Juan de Fuca. Guests are treated to unparalleled vistas of the Dungeness Spit and Victoria, BC, all from the comfort of our idyllic location. Situated adjacent to the Olympic Bluffs Cidery & Lavender Farm, our guests have the opportunity to explore the orchards and lavender fields at their leisure.
          </p>
          <a
            href="https://www.saltandcedarbedandbreakfast.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-sage-500 text-white px-8 py-3 rounded-md hover:bg-sage-600 transition-colors text-sm font-medium tracking-wide"
          >
            MORE INFO
          </a>
        </div>
      </section>

      {/* Pacific Northwest Experience Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 tracking-wide">
            A PACIFIC NORTHWEST EXPERIENCE
          </h2>
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
            Elopements & Wedding Events
          </h3>
          <p className="text-gray-700 leading-relaxed mb-8">
            In collaboration with Goat & Radish Catering and Jean Lenke Music, as well as a comprehensive network of skilled local wedding service providers, we are dedicated to making your special occasion unforgettable. Our complimentary wedding planning consultation and customizable wedding packages are designed to ensure your dream day is realized. A Salt & Cedar Wedding Experience Package is awaiting for you! Contact us for a tour and consultation.
          </p>
          <a
            href="https://www.saltandcedarbedandbreakfast.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-sage-500 text-white px-8 py-3 rounded-md hover:bg-sage-600 transition-colors text-sm font-medium tracking-wide"
          >
            CONTACT US
          </a>
        </div>
      </section>

      {/* Bottom Image Section */}
      <section className="relative h-[500px] md:h-[600px] bg-gray-200">
        <img
          src="/images/saltandcedar/chairs.jpg"
          alt="Lavender fields view with chairs"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      </section>
    </>
  );
}
