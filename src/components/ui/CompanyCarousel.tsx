"use client";

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';

interface Company {
  name: string;
  logo: string;
}

const companies: Company[] = [
  { name: 'Base.vn', logo: '/logos/basevn-logo.png' },
  { name: 'CakeResume', logo: '/logos/cake-logo.png' },
  { name: 'CareerViet', logo: '/logos/careerviet-logo.png' },
  { name: "MISA AMIS", logo: 'https://amis.misa.vn/wp-content/uploads/2020/12/logo.svg' },
  { name: "VietnamWorks", logo: 'https://www.vietnamworks.com/assets-page-container/images/vnw_empower_growth_logo.png'}
];

export default function CompanyCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'start',
      skipSnaps: false,
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      // Optional: Add any event listeners here
    }
  }, [emblaApi]);

  return (
    <div className="relative w-full max-w-6xl mx-auto px-12">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 md:gap-8">
          {companies.map((company, index) => (
            <div
              key={index}
              className="flex-[0_0_150px] md:flex-[0_0_200px] min-w-0 flex items-center justify-center"
            >
              <div className="bg-white rounded-lg p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 w-full h-20 md:h-24 flex items-center justify-center border border-gray-100">
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={160}
                  height={80}
                  className="max-w-full max-h-full object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                />
              </div>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {companies.map((company, index) => (
            <div
              key={`dup-${index}`}
              className="flex-[0_0_150px] md:flex-[0_0_200px] min-w-0 flex items-center justify-center"
            >
              <div className="bg-white rounded-lg p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 w-full h-20 md:h-24 flex items-center justify-center border border-gray-100">
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={160}
                  height={80}
                  className="max-w-full max-h-full object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <button
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10 hidden md:block"
        onClick={scrollPrev}
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10 hidden md:block"
        onClick={scrollNext}
        aria-label="Next slide"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
