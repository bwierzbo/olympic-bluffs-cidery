import Image from 'next/image';

export default function Contact() {
  return (
    <>
      {/* Farm Hours Section */}
      <section className="bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Lavender Basket Image - Left */}
          <div className="relative h-[400px] md:h-[500px]">
            <Image
              src="/images/hours-lavender-basket.jpg"
              alt="Lavender basket"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Farm Hours Text - Right */}
          <div className="flex items-center justify-center p-8 md:p-16 bg-white">
            <div className="max-w-md text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 tracking-wide">
                FARM HOURS
              </h1>
              <p className="text-gray-600 mb-4 leading-relaxed">
                We are closed for the Winter Season.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Please call us <strong>(123) 456-7890</strong> for information outside regular hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="bg-white border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Location Text - Left */}
          <div className="flex items-center justify-center p-8 md:p-16 bg-white order-2 md:order-1">
            <div className="max-w-md">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 tracking-wide">
                LOCATION
              </h2>

              {/* Map Placeholder */}
              <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-6">
                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>

              <div className="text-center text-gray-600 leading-relaxed">
                <p className="mb-2">We are located at:</p>
                <p className="font-semibold text-gray-900">
                  1025 Finn Hall Road<br />
                  Port Angeles, WA 98362
                </p>
                <p className="mt-4">
                  <strong>(123) 456-7890</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Farm/Lavender Building Image - Right */}
          <div className="relative h-[400px] md:h-[500px] order-1 md:order-2">
            <Image
              src="/images/hours-farm-building.jpg"
              alt="Olympic Bluffs Cidery and lavender farm"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
