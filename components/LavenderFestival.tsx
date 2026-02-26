import Image from 'next/image';

const schedule = {
  friday: {
    day: 'FRIDAY',
    events: [
      '10 - 5 pm Artisan Vendor Market & Food Trucks',
      '1-3 pm Kite Flying\n(First 50 kites are free!)',
      'Live Music\nTBD',
    ],
  },
  saturday: {
    day: 'SATURDAY',
    events: [
      '10 - 5 pm Artisan Vendor Market & Food Trucks',
      '1-3 pm Kite Flying\n(First 50 kites are free!)',
      'Live Music by\nBread & Gravy 1:30-3:30',
    ],
  },
  sunday: {
    day: 'SUNDAY',
    events: [
      '10 - 5 pm Artisan Vendor Market & Food Trucks',
      '1-3 pm Kite Flying\n(First 50 kites are free!)',
      'Live Music\nTBD',
    ],
  },
};

const faqs = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    question: 'DOES IT COST TO ENTER THE FARM?',
    answer: 'The farm is free to enter!',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.07-.504 1.003-1.121A48.627 48.627 0 0018 9.75h-1.5a.75.75 0 01-.706-.498L14.19 5.632A1.5 1.5 0 0012.791 4.5H9.375a1.5 1.5 0 00-1.4.964L6.37 9.252a.75.75 0 01-.706.498H4.5A2.25 2.25 0 002.25 12v5.25" />
      </svg>
    ),
    question: 'IS THERE ON-SITE PARKING?',
    answer: 'Yes! We have a designated parking area in one of our grassy fields close to all of the fun.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m7.594-4.797h-.01" />
      </svg>
    ),
    question: 'ARE DOGS ALLOWED ON THE FARM?',
    answer: 'Leashed dogs are welcome on the farm! Please be respectful of others space and clean up after your pet.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
    question: 'WHERE IS THE FARM LOCATED?',
    answer: '1025 Finn Hall Road, Port Angeles off of Old Olympic Highway.',
  },
];

export default function LavenderFestival() {
  return (
    <>
      {/* Festival Header Banner */}
      <section className="bg-lavender-500 py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-[0.15em] mb-2">
            LAVENDER FESTIVAL WEEKEND
          </h2>
          <p className="text-xl md:text-2xl font-bold text-white tracking-[0.15em]">
            JULY 17-20, 2026
          </p>
        </div>
      </section>

      {/* Schedule Section with Background Image */}
      <section className="relative">
        <div className="relative min-h-[500px] md:min-h-[550px]">
          <Image
            src="/images/farm/lavender-banner.jpg"
            alt="Lavender fields at Olympic Bluffs"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />

          {/* Schedule Cards */}
          <div className="relative z-10 flex items-center justify-center min-h-[500px] md:min-h-[550px] px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full">
              {Object.values(schedule).map((day) => (
                <div
                  key={day.day}
                  className="bg-white/85 backdrop-blur-sm px-6 py-8 text-center"
                >
                  <h3 className="text-lg font-bold text-lavender-600 tracking-[0.15em] mb-6">
                    {day.day}
                  </h3>
                  <div className="space-y-5">
                    {day.events.map((event, i) => (
                      <p
                        key={i}
                        className="text-sm text-gray-700 leading-relaxed whitespace-pre-line"
                      >
                        {event}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-14 bg-lavender-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {faqs.map((faq, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="text-lavender-600 mb-4">{faq.icon}</div>
                <h4 className="text-sm font-bold text-lavender-800 tracking-[0.1em] mb-3 leading-snug">
                  {faq.question}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">
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
