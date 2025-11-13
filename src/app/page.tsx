'use client';

import CompanyCarousel from "@/components/ui/CompanyCarousel";
import CTAButton from "@/components/ui/CTAButton";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              {/* Sử dụng Next.js Image để tối ưu hình ảnh */}
              <Image
                src="/fastrezu-logo/trans_bg.png"
                alt="FastRezu Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                priority
              />
              <span className="heading-feature text-xl text-gray-900">
                {t('landing.header.brandName')}
              </span>
            </div>
            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              
              {/* === Tối ưu H1: Đánh thẳng vào đối thủ === */}
              <h1 className="heading-main text-3xl sm:text-4xl lg:text-6xl text-gray-900 mb-4 sm:mb-6">
                {t('landing.hero.title')}
                <br className="hidden lg:block" />
                <span className="text-blue-600">{t('landing.hero.titleHighlight')}</span> {t('landing.hero.titleAction')}
              </h1>

              {/* === Tối ưu H2: Nhấn mạnh 41% công ty dùng AI === */}
              <h2 className="heading-sub text-lg sm:text-xl lg:text-2xl text-gray-700 mb-4 sm:mb-6">
                {t('landing.hero.subtitle')}
              </h2>

              {/* === Tối ưu P: Khẳng định sự khác biệt (Viết hộ) === */}
              <p className="body-text text-base sm:text-lg text-gray-700 mb-6 sm:mb-8">
                {t('landing.hero.description')}
              </p>

              {/* Nút CTA giữ nguyên */}
              <div className="max-w-md mx-auto lg:mx-0">
                <CTAButton />
              </div>
            </div>

            {/* Mockup giữ nguyên */}
            <div className="flex justify-center order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md animate-fade-in-up">
                <div className="bg-gray-100 rounded-lg p-4 sm:p-6 mb-4">
                  <div className="h-3 sm:h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-2 sm:h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-2 sm:h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-500 mb-2 animate-pulse-slow">
                    95/100
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700">
                    {t('landing.hero.atsScoreLabel')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Carousel Section */}
      <section className="bg-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <p className="body-text text-gray-600 text-sm sm:text-base">
              {t('landing.companies.title')}
            </p>
          </div>
          <CompanyCarousel />
        </div>
      </section>

      {/* Pain Points Section (Giờ là "Bằng chứng Thị trường") */}
      <section className="bg-white py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
            <h2 className="heading-main text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 sm:mb-6">
              {t('landing.painPoints.sectionTitle')} <br className="hidden sm:block" />
              {t('landing.painPoints.sectionTitleBreak')}
            </h2>
            <p className="body-text text-gray-700 mb-6 sm:mb-8 max-w-4xl mx-auto text-center text-sm sm:text-base">
              {t('landing.painPoints.sectionDescription')}
            </p>
          </div>
          {/* === Cập nhật 3 cột nỗi đau === */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* === Tối ưu Cột 1: Tập trung vào Nỗi đau chính === */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🏆</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                {t('landing.painPoints.pain1.title')}
              </h3>
              <p className="body-text text-gray-700 text-sm sm:text-base">
                {t('landing.painPoints.pain1.description')}
              </p>
            </div>
            
            {/* === Tối ưu Cột 2: Tối ưu Từ khóa === */}
            <div className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🤖</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                {t('landing.painPoints.pain2.title')}
              </h3>
              <p className="body-text text-gray-700 text-sm sm:text-base">
                {t('landing.painPoints.pain2.description')}
              </p>
            </div>
            
            {/* === Tối ưu Cột 3: Vấn đề Template (Đánh vào Canva/TopCV) === */}
            <div className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl">🎨</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4">
                {t('landing.painPoints.pain3.title')}
              </h3>
              <p className="body-text text-gray-700 text-sm sm:text-base">
                {t('landing.painPoints.pain3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Features Section */}
      <section className="bg-linear-to-br from-blue-50 to-indigo-100 py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16">
            {/* === Tối ưu H2: Nhấn mạnh sự khác biệt === */}
            <h2 className="heading-main text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 sm:mb-6">
              {t('landing.features.sectionTitle')}
              <br className="hidden sm:block" />
              {t('landing.features.sectionTitleBreak')}
            </h2>
            <p className="body-text text-gray-700 mb-6 sm:mb-8 max-w-4xl mx-auto text-center text-sm sm:text-base">
              {t('landing.features.sectionDescription')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Box 1: AI Viết Hộ (Cốt lõi) */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">✍️✨</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                {t('landing.features.feature1.title')}
              </h3>
              <p className="body-text text-gray-700 text-center text-sm sm:text-base">
                {t('landing.features.feature1.description')}
              </p>
            </div>
            
            {/* Box 2: JD Analysis */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">🔍🎯</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                {t('landing.features.feature2.title')}
              </h3>
              <p className="body-text text-gray-700 text-center text-sm sm:text-base">
                {t('landing.features.feature2.description')}
              </p>
            </div>

            {/* Box 3: Checker (Upload & Check) */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-xl sm:text-2xl">📊✅</span>
              </div>
              <h3 className="heading-feature text-lg sm:text-xl text-gray-900 mb-3 sm:mb-4 text-center">
                {t('landing.features.feature3.title')}
              </h3>
              <p className="body-text text-gray-700 text-center text-sm sm:text-base">
                {t('landing.features.feature3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Giữ nguyên v4 */}
      <section className="bg-gray-900 text-white py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="heading-main text-xl sm:text-2xl lg:text-3xl mb-4 sm:mb-6">
              {t('landing.cta.title')}
            </h2>
            <p className="body-text text-lg sm:text-xl text-gray-400 mb-6 sm:mb-8">
              {t('landing.cta.description')}
            </p>
            {/* Nút CTA giữ nguyên */}
            <div className="max-w-md mx-auto">
              <CTAButton variant="secondary" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Giữ nguyên */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500">
            {t('landing.footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
}
