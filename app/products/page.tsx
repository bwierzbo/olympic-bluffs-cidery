import Hero from '@/components/Hero';

export default function Products() {
  const products = [
    {
      name: 'Classic Dry',
      type: 'Year-Round',
      abv: '6.5%',
      description:
        'Our flagship cider. Crisp, clean, and refreshing with a perfect balance of tartness and subtle sweetness. Made from a blend of heritage apples.',
    },
    {
      name: 'Honey Crisp',
      type: 'Year-Round',
      abv: '5.5%',
      description:
        'A semi-sweet cider featuring the beloved Honeycrisp apple variety. Enhanced with local wildflower honey for a smooth, aromatic finish.',
    },
    {
      name: 'Barrel Aged Reserve',
      type: 'Limited Release',
      abv: '7.2%',
      description:
        'Aged for 12 months in oak barrels that previously held bourbon. Complex notes of vanilla, caramel, and toasted oak complement the apple base.',
    },
    {
      name: 'Hopped Cider',
      type: 'Seasonal',
      abv: '6.0%',
      description:
        'A unique hybrid featuring Cascade hops for a citrusy, floral aroma. Dry and refreshing with a crisp finish.',
    },
    {
      name: 'Rosé Cider',
      type: 'Seasonal',
      abv: '5.8%',
      description:
        'Blended with fresh raspberries and strawberries. Light, fruity, and perfectly balanced between sweet and tart.',
    },
    {
      name: 'Spiced Winter',
      type: 'Seasonal',
      abv: '6.0%',
      description:
        'Warm spices including cinnamon, nutmeg, and clove make this the perfect cold-weather cider. Semi-sweet and comforting.',
    },
  ];

  return (
    <>
      <Hero
        title="Our Ciders"
        subtitle="Handcrafted with Pacific Northwest apples"
        height="medium"
      />

      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The Collection
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From classic dry ciders to innovative seasonal blends, our collection
              offers something for every palate. All ciders are gluten-free and made
              with 100% fresh-pressed apple juice.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.name}
                className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="h-64 bg-gradient-to-br from-amber-200 to-amber-400" />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {product.name}
                    </h3>
                    <span className="text-sm font-semibold text-amber-700">
                      {product.abv}
                    </span>
                  </div>
                  <p className="text-sm text-amber-600 font-medium mb-3">
                    {product.type}
                  </p>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div className="bg-gradient-to-br from-amber-300 to-amber-500 rounded-lg h-96" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                The Cider Making Process
              </h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-lg mb-2">1. Apple Selection</h3>
                  <p>
                    We carefully select apples from local orchards, choosing varieties
                    that bring the perfect balance of sweetness, acidity, and tannins.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">2. Pressing</h3>
                  <p>
                    Fresh apples are pressed to extract pure juice, with no concentrates
                    or additives.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">3. Fermentation</h3>
                  <p>
                    Natural fermentation transforms the apple juice into cider over
                    several weeks, developing complex flavors.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">4. Aging & Bottling</h3>
                  <p>
                    After fermentation, ciders are aged to perfection before being
                    bottled and shared with you.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
