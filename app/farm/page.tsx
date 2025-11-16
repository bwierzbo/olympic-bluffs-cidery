import Image from 'next/image';
/* eslint-disable @next/next/no-img-element */

export default function Farm() {
  const farmSections = [
    {
      title: 'LAVENDER BOUTIQUE',
      image: '/images/farm/lavender-boutique.jpeg',
      description: 'Our farm has produced fresh, hand-tied bundles of dried lavender fresh lavender buds harvested from the fields just steps away from our farm. We have hand crafted lavender sachets, lavender dryer bags, lavender bundles, and other lavender products.',
    },
    {
      title: 'ANCIENT GRAINS',
      image: '/images/farm/ancient-grains.jpeg',
      description: 'Ancient grains have been grown for thousands of years and remained relatively unchanged, meaning they haven\'t been bred or changed to improve yield or disease resistance. Examples include quinoa, millet, farro, barley, wild rice. We love to share what we\'ve learned about these ancient grains and their uses with our visitors and at our local farmers market.',
    },
    {
      title: 'THE FIELDS',
      image: '/images/farm/lavender-fields.jpeg',
      description: 'Our fields come to life, touch and float among blooms, smell the sweet lavender scent, view the Olympic mountains, look for the bees in our lavender and find the peaceful sight for all of harvests and special events making the days of summer and all the fall summer.',
    },
    {
      title: 'THE BLUFFS',
      image: '/images/farm/bluffs.jpeg',
      description: 'On high bluffs we\'re overlooking blue majestic waters, you can see a great view from our fields, enjoy the peaceful afternoon and our produce from golden blueberry bushes to our bright white yarrow and our planted trees has been a true field committed to the farm.',
    },
    {
      title: 'THE ORCHARD',
      image: '/images/farm/orchard.jpeg',
      description: 'Our orchard is home to 200 semi-dwarf apple trees, planted in 2015. We love fresh apples, cider, and watching the orchard grow each year. We enjoy sharing and using the apples to make the best lavender apple pie and apple sauce during our harvest events and at our lavender and farm-yard sales.',
    },
    {
      title: 'THE CIDERY',
      image: '/images/farm/keg.jpeg',
      description: 'At Olympic Bluffs Cidery, we craft small-batch, artisan hard ciders using apples from our orchard and other local orchards. We pride ourselves on keeping it simple and fresh. Our ciders are gluten free with nothing added. Our tasting room offers a rustic and relaxed setting and live music on the weekends. Proceeds from our sales help support the Olympic Peninsula.',
    },
    {
      title: 'THE APIARY',
      image: '/images/farm/lavender-fields.jpeg',
      description: 'Our apiary is an essential part of our farm ecosystem. We have the Health of our bees and their pollination services are key to the success of our crops. We love bees watching them visiting our lavender, grains, apples and other flowering plants, sharing about their vital role and learning from local beekeepers.',
    },
    {
      title: 'SALT AND CEDAR BED & BREAKFAST',
      image: '/images/farm/salt-cedar-bnb.jpeg',
      description: 'The Salt Cedar and Bed & Breakfast sits high on the bluffs overlooking the Strait of Juan de Fuca and the lavender fields. Guests are greeted by a contemporary and stylish yet warm and inviting atmosphere. In the quiet corner of our property and views of the farm create a uniquely special Washington State getaway. To learn more about booking a stay visit www.saltandcedarnb.com',
    },
  ];

  const faqs = [
    {
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      question: 'IS THE CIDERY CURRENTLY OPEN?',
      answer: 'We are closed for the 2024/2025 season but stay tuned for updates on when we open!',
    },
    {
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      question: 'ARE DOGS ALLOWED ON THE FARM?',
      answer: 'Leashed dogs are welcome! We just ask that you clean up after them and respect others space.',
    },
    {
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      question: 'DOES IT COST ANYTHING TO ENTER THE FARM?',
      answer: 'The farm is free to enter!',
    },
    {
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      question: 'IS THE FARM WHEELCHAIR FRIENDLY?',
      answer: 'Our fields and pathways are generally flat with some uneven ground.',
    },
    {
      icon: (
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      question: 'IS THE FARM OPEN ALL YEAR?',
      answer: 'For 2025, the farm is open starting on Mother\'s Day. Friday: 12-4 pm, Saturday: 11-5 pm, Sunday: 12-4 pm',
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[200px] md:h-[250px]">
        <img
          src="/images/farm/lavender-banner.jpeg"
          alt="Lavender fields"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white tracking-wider px-4">
            EXPLORE THE FARM
          </h1>
        </div>
      </section>

      {/* Farm Sections Grid */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {farmSections.map((section) => (
              <div key={section.title} className="bg-white border border-gray-200 overflow-hidden h-[300px] sm:h-[280px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 h-full">
                  {/* Image */}
                  <div className="relative h-48 sm:h-full">
                    <Image
                      src={section.image}
                      alt={section.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {/* Text */}
                  <div className="bg-gray-800 text-white p-6 flex flex-col justify-start overflow-y-auto">
                    <h3 className="text-lg font-bold mb-3 tracking-wide">
                      {section.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-200">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 tracking-wider">
            FAQ&apos;S
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {faqs.map((faq) => (
              <div key={faq.question} className="text-center">
                <div className="flex justify-center mb-4">
                  {faq.icon}
                </div>
                <h3 className="text-sm font-bold mb-3 tracking-wide">
                  {faq.question}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
