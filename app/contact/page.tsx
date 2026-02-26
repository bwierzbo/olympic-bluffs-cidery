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
                Open April 30th - Thursday through Sunday, 12 - 5 pm<br />
                Lavender Festival Weekend (July 17-20): 10 am - 5 pm
              </p>
              <p className="text-gray-600 leading-relaxed">
                Please call us <strong>(571) 439-1311</strong> or email us at{' '}
                <a href="mailto:info@olympicbluffs.com" className="text-sage-700 underline">info@olympicbluffs.com</a>{' '}
                for information outside regular hours.
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

              {/* Google Maps Embed */}
              <div className="rounded-lg h-48 overflow-hidden mb-6">
                <iframe
                  src="https://maps.google.com/maps?q=1025+Finn+Hall+Road,+Port+Angeles,+WA+98362&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Olympic Bluffs Cidery & Lavender Farm Location"
                ></iframe>
              </div>

              <div className="text-center text-gray-600 leading-relaxed">
                <p className="mb-2">We are located at:</p>
                <p className="font-semibold text-gray-900">
                  1025 Finn Hall Road<br />
                  Port Angeles, WA 98362
                </p>
                <p className="mt-4">
                  <strong>(571) 439-1311</strong>
                </p>
                <p className="mt-1">
                  <a href="mailto:info@olympicbluffs.com" className="text-sage-700 underline">info@olympicbluffs.com</a>
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
