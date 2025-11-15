import Hero from '@/components/Hero';

export default function About() {
  return (
    <>
      <Hero
        title="Our Story"
        subtitle="Crafting exceptional ciders since 2010"
        height="medium"
      />

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                A Passion for Cider
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Olympic Bluffs Cidery was founded with a simple mission: to create
                  exceptional hard ciders that showcase the incredible apples of the
                  Pacific Northwest. What started as a small hobby quickly grew into
                  a passion for crafting premium beverages.
                </p>
                <p>
                  Located in Port Townsend, Washington, we&apos;re surrounded by some of the
                  finest apple orchards in the country. We work closely with local farmers
                  to source the best fruit, ensuring that every bottle captures the essence
                  of our region.
                </p>
                <p>
                  Our commitment to quality extends beyond ingredients. We use traditional
                  fermentation methods combined with modern techniques to create ciders
                  that are both classic and innovative.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-200 to-amber-400 rounded-lg h-96" />
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-amber-700 rounded-full mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Quality First
              </h3>
              <p className="text-gray-600">
                We never compromise on ingredients or process, ensuring every bottle
                meets our high standards.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-amber-700 rounded-full mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Local Partnership
              </h3>
              <p className="text-gray-600">
                Supporting local farmers and orchards is at the heart of everything
                we do.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-amber-700 rounded-full mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sustainability
              </h3>
              <p className="text-gray-600">
                We&apos;re committed to sustainable practices that protect our beautiful
                region for future generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Meet the Team
            </h2>
            <p className="text-lg text-gray-600">
              Our small but dedicated team brings together decades of experience in
              cider making, agriculture, and hospitality. We&apos;re passionate about
              what we do and love sharing our craft with visitors.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
