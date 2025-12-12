"use client";

import Image from "next/image";

interface Company {
  name: string;
  logo: string;
}

const companies: Company[] = [
  { name: "Base.vn", logo: "/logos/basevn-logo.png" },
  { name: "CakeResume", logo: "/logos/cake-logo.png" },
  { name: "CareerViet", logo: "/logos/careerviet-logo.png" },
  {
    name: "MISA AMIS",
    logo: "https://amis.misa.vn/wp-content/uploads/2020/12/logo.svg",
  },
  {
    name: "VietnamWorks",
    logo: "https://www.vietnamworks.com/assets-page-container/images/vnw_empower_growth_logo.png",
  },
];

export default function CompanyCarousel() {
  // Duplicate companies for seamless infinite scroll
  const duplicatedCompanies = [...companies, ...companies];

  return (
    <div className="relative w-full max-w-6xl mx-auto overflow-hidden">
      {/* Gradient fade on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <div className="flex animate-scroll hover:pause-animation">
        {duplicatedCompanies.map((company, index) => (
          <div
            key={index}
            className="shrink-0 w-[180px] md:w-[220px] mx-3 md:mx-4"
          >
            <div className="bg-white rounded-lg p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow duration-300 h-20 md:h-24 flex items-center justify-center border border-gray-100">
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

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 25s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
