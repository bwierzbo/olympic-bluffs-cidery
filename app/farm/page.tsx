import Image from 'next/image';

export default function Farm() {
  const farmSections = [
    {
      title: 'LAVENDER BOUTIQUE',
      image: '/images/farm/lavender-boutique.jpeg',
      description: 'Step inside our Lavender Shop, where the soothing scent of lavender welcomes you into a treasure trove of handcrafted products. From pure essential oils and bath luxuries to culinary delights and artisan gifts, each item reflects our commitment to quality, sustainability, and natural beauty.',
    },
    {
      title: 'ANCIENT GRAINS',
      image: '/images/farm/ancient-grains.jpeg',
      description: 'Partnering with the WSU Breadlab, a leader in grain research and innovation, our goal is to cultivate grain crops that support a resilient and diverse food system. We mill grains from our field into flour and actively engage with the community in the conversation about where food comes from and how it\'s grown. Our goal is to help shape a future where nutrition and sustainability go hand in hand.',
    },
    {
      title: 'THE FIELDS',
      image: '/images/farm/lavender-fields.jpeg',
      description: 'Our fields come to life from mid-June through August, when the lavender burst into bloom painting the landscape in shades of purple, pink and white. Whether you\'re here to take in the beauty, enjoy the aromas, or experience the farm\'s bounty, our fields offer a truly unforgettable setting.',
    },
    {
      title: 'THE BLUFFS',
      image: '/images/farm/bluffs.jpeg',
      description: 'The high bluffs offer breathtaking 360-degree views of the Strait of Juan de Fuca, the Olympic Mountains, and our farm. This stunning vantage point changes with the seasons, from golden summer sunsets over the water to misty mountain mornings in the fall. It\'s the perfect place to soak in the beauty of the Olympic Peninsula and feel connected to the land around you.',
    },
    {
      title: 'THE ORCHARD',
      image: '/images/farm/orchard.jpeg',
      description: 'Our orchard is home to 480 semi-dwarf cider apple trees, carefully cultivated to produce the rich, complex flavors that define our ciders. As the orchard matures, it continues to shape the character of our ciders, reflecting the unique terroir of our farm and the maritime climate of the Olympic Peninsula.',
    },
    {
      title: 'THE CIDERY',
      image: '/images/farm/keg.jpeg',
      description: 'At Olympic Bluffs Cidery, we craft small-batch ciders that showcase the unique character of our orchard-grown apples. From pressing fresh apples to fermenting, aging, and bottling on-site, every step is guided by a commitment to quality and sustainability. With each bottle, our goal to capture the essence of our farm and the flavors of the Olympic Peninsula.',
    },
    {
      title: 'THE APIARY',
      image: '/images/farm/apiary.jpg',
      description: 'Our apiary is an essential part of our farm, supporting the health of our orchard and lavender fields through natural pollination. Home to thriving colonies of Italian honeybees, known for their gentle nature and strong honey production, our hives play a vital role in maintaining the biodiversity of our land. Nestled near our century-old apple tree, the apiary is a sight to see as you drive in, with bees busily at work among the blossoms.',
    },
    {
      title: 'SALT AND CEDAR BED & BREAKFAST',
      image: '/images/farm/salt-cedar-bnb.jpeg',
      description: 'Salt and Cedar B&B sits atop the high bluffs overlooking the Strait of Juan de Fuca, offering breathtaking water and mountain views. Whether you\'re here for a peaceful retreat or an adventure-filled getaway, Salt & Cedar provides a welcoming and serene escape. For more details, visit us at saltandcedarbedandbreakfast.com',
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
        <Image
          src="/images/farm/lavender-banner.jpg"
          alt="Lavender fields"
          fill
          className="object-cover"
          priority
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {farmSections.map((section) => (
              <div key={section.title} className="bg-white overflow-hidden flex flex-col sm:flex-row h-auto sm:h-[240px]">
                {/* Image */}
                <div className="relative w-full sm:w-[180px] h-[200px] sm:h-full flex-shrink-0">
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Text */}
                <div className="bg-gray-800 text-white p-6 flex flex-col justify-start flex-grow">
                  <h3 className="text-base font-bold mb-3 tracking-wider uppercase">
                    {section.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-200">
                    {section.description}
                  </p>
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
