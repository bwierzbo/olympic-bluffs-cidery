import Link from 'next/link';

export default function SaltCedarBnB() {
  return (
    <>
      {/* Hero Section with Building */}
      <section className="relative h-[400px] md:h-[500px]">
        <img
          src="/images/saltandcedar/building.jpeg"
          alt="Salt & Cedar Bed and Breakfast"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </section>

      {/* Welcome Text Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-700 leading-relaxed mb-8">
            Overlooking acres and acres of lavender fields, The Salt & Cedar Bed and Breakfast sits high on the bluffs overlooking the Strait of Juan de Fuca. Guests are greeted by a contemporary and stylish, yet warm and inviting atmosphere. In the quiet corner of our property, and views of the farm, creates a uniquely special Washington State Getaway. With only eight rooms, our intimate boutique inn provides you a personalized experience to remember. Come, stay awhile and enjoy.
          </p>
          <a
            href="https://www.saltandcedarnb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-sage-500 text-white px-8 py-3 rounded-md hover:bg-sage-600 transition-colors text-sm font-medium tracking-wide"
          >
            LEARN MORE
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
            Engagements & Wedding Events
          </h3>
          <p className="text-gray-700 leading-relaxed mb-8">
            Looking for a PRIVATE intimate and elegant setting close to Port Angeles and the Sequim Valley for your engagement, wedding or special event? We can offer a beautiful setting with views and exclusive use of the property. Our property includes a beautiful great room, a commercial kitchen, 8 guest rooms and outdoor spaces overlooking fields and mountains. With only 8 bedrooms, we can accommodate smaller groups and offer a more personalized and intimate experience for your guests. Contact us to discuss your special day.
          </p>
          <a
            href="https://www.saltandcedarnb.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-sage-500 text-white px-8 py-3 rounded-md hover:bg-sage-600 transition-colors text-sm font-medium tracking-wide"
          >
            LEARN MORE
          </a>
        </div>
      </section>

      {/* Bottom Image Section */}
      <section className="relative h-[300px] md:h-[400px]">
        <img
          src="/images/saltandcedar/chairs.jpg"
          alt="Lavender fields view with chairs"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </section>
    </>
  );
}
