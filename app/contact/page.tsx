import Hero from '@/components/Hero';

export default function Contact() {
  return (
    <>
      <Hero
        title="Visit Us"
        subtitle="Experience our ciders in our tasting room"
        height="medium"
      />

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Tasting Room
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Location
                  </h3>
                  <p className="text-gray-600">
                    123 Cider Lane<br />
                    Port Townsend, WA 98368
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Hours
                  </h3>
                  <div className="text-gray-600 space-y-1">
                    <p>Thursday - Sunday: 12:00 PM - 6:00 PM</p>
                    <p>Monday - Wednesday: Closed</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Contact
                  </h3>
                  <div className="text-gray-600 space-y-1">
                    <p>Phone: (360) 555-0123</p>
                    <p>Email: info@olympicbluffscidery.com</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    What to Expect
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>Guided tastings of our current offerings</li>
                    <li>Tours of our production facility (by appointment)</li>
                    <li>Cider available for purchase by the bottle or case</li>
                    <li>Outdoor seating with beautiful views</li>
                    <li>Family and pet-friendly environment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div>
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg h-96 flex items-center justify-center mb-6">
                <p className="text-gray-600 text-lg">Map Placeholder</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Getting Here
                </h3>
                <p className="text-gray-600 text-sm">
                  We&apos;re located in downtown Port Townsend, easily accessible from
                  Highway 20. Free parking is available on-site. From Seattle, take
                  the Edmonds-Kingston ferry for a scenic 90-minute drive through the
                  Olympic Peninsula.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Send Us a Message
            </h2>
            <p className="text-gray-600">
              Have questions or want to schedule a private event? We&apos;d love to hear
              from you!
            </p>
          </div>

          <form className="bg-white rounded-lg shadow-md p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="first-name"
                  name="first-name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label
                  htmlFor="last-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="last-name"
                  name="last-name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="mt-6">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full bg-amber-700 text-white px-6 py-3 rounded-md font-semibold hover:bg-amber-800 transition-colors"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
