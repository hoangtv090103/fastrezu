"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import CompanyCarousel from "@/components/ui/CompanyCarousel";
import { storeFileForUpload } from "@/lib/pending-cv-storage";

export default function LandingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection and store before redirect
  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const isValidType =
      validTypes.includes(file.type) ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isValidType) {
      alert(t("upload.errors.invalidFileType"));
      return;
    }

    // Check file size (max 5MB for localStorage)
    if (file.size > 5 * 1024 * 1024) {
      alert(t("upload.errors.fileTooLarge"));
      return;
    }

    setIsUploading(true);

    try {
      const stored = await storeFileForUpload(file);
      if (stored) {
        // Redirect to login with pending CV flag
        router.push("/login?pending_cv=true");
      } else {
        alert(t("upload.errors.storageFailed"));
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Error storing file:", error);
      alert(t("upload.errors.unexpectedError"));
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCreateCV = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Image
                src="/fastrezu-logo/trans_bg.png"
                alt="FastRezu Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                priority
              />
              <span className="heading-feature text-xl text-gray-900">
                {t("landing.header.brandName")}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={handleCreateCV}
                className="hidden sm:block px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-medium transition-colors rounded-lg cursor-pointer"
              >
                {t("auth.login")}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-12 md:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Text */}
            <div className="text-center lg:text-left animate-fade-in-up">
              <h1 className="heading-main text-3xl sm:text-4xl lg:text-5xl text-gray-900 mb-4">
                {t("landing.hero.title")}
                <span className="block text-blue-600 mt-2">
                  {t("landing.hero.titleHighlight")}
                </span>
                <span className="block gradient-text mt-1">
                  {t("landing.hero.titleAction")}
                </span>
              </h1>
              <p className="body-text text-gray-600 text-base sm:text-lg mb-6 max-w-xl mx-auto lg:mx-0">
                {t("landing.hero.subtitle")}
              </p>

              {/* Mobile CTA */}
              <div className="lg:hidden mb-6">
                <button
                  onClick={handleUploadClick}
                  className="btn-primary w-full text-lg py-4"
                >
                  {t("upload.mobileCTA")}
                </button>
              </div>
            </div>

            {/* Right Column - Upload Widget */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-100">
                <div className="text-center mb-6">
                  <h2 className="heading-sub text-xl sm:text-2xl text-gray-900 mb-2">
                    {t("landing.uploadWidget.heading")}
                  </h2>
                  <p className="body-text text-gray-600">
                    {t("landing.uploadWidget.subheading")}
                  </p>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Upload Zone */}
                <div
                  onClick={handleUploadClick}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleUploadClick();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={
                    isUploading
                      ? t("upload.processing")
                      : t("landing.uploadWidget.button")
                  }
                  aria-disabled={isUploading}
                  className={`border-2 border-dashed rounded-xl p-8 sm:p-10 cursor-pointer transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isDragging
                      ? "border-blue-600 bg-blue-100"
                      : "border-blue-300 hover:border-blue-500 hover:bg-blue-50/50"
                  } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div className="flex flex-col items-center">
                    {/* Upload Icon / Loading */}
                    <div className="mb-4 p-4 bg-blue-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                      {isUploading ? (
                        <svg
                          className="w-10 h-10 text-blue-600 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-10 h-10 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Visual label - not a nested button */}
                    <span className="btn-primary mb-3 text-base sm:text-lg px-6 py-3 pointer-events-none">
                      {isUploading
                        ? t("upload.processing")
                        : t("landing.uploadWidget.button")}
                    </span>

                    {/* Drag text */}
                    <p className="small-text text-gray-500">
                      {isDragging
                        ? t("upload.dragActive")
                        : t("landing.uploadWidget.dragText")}
                    </p>

                    {/* File formats */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        📄 PDF
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        📝 DOCX
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t("upload.trustBadges.free")}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t("upload.trustBadges.noSignup")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-indigo-200 rounded-full blur-3xl opacity-40" />
      </section>

      {/* Companies Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <p className="text-center small-text text-gray-500 mb-8">
            {t("landing.companies.title")}
          </p>
          <CompanyCarousel />
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-sub text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4">
              {t("landing.painPoints.sectionTitle")}
              <span className="block text-blue-600 mt-2 font-bold">
                {t("landing.painPoints.sectionTitleBreak")}
              </span>
            </h2>
            <p className="body-text text-gray-600 max-w-3xl mx-auto">
              {t("landing.painPoints.sectionDescription")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Pain 1 */}
            <div className="bg-linear-to-br from-red-50 to-orange-50 rounded-2xl p-6 lg:p-8 card-hover border border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="heading-feature text-lg text-gray-900 mb-2">
                {t("landing.painPoints.pain1.title")}
              </h3>
              <p className="small-text text-gray-600">
                {t("landing.painPoints.pain1.description")}
              </p>
            </div>

            {/* Pain 2 */}
            <div className="bg-linear-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 lg:p-8 card-hover border border-yellow-100">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="heading-feature text-lg text-gray-900 mb-2">
                {t("landing.painPoints.pain2.title")}
              </h3>
              <p className="small-text text-gray-600">
                {t("landing.painPoints.pain2.description")}
              </p>
            </div>

            {/* Pain 3 */}
            <div className="bg-linear-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 lg:p-8 card-hover border border-purple-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="heading-feature text-lg text-gray-900 mb-2">
                {t("landing.painPoints.pain3.title")}
              </h3>
              <p className="small-text text-gray-600">
                {t("landing.painPoints.pain3.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-linear-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="heading-sub text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4">
              {t("landing.features.sectionTitle")}
              <span className="block text-green-600 mt-2 font-bold">
                {t("landing.features.sectionTitleBreak")}
              </span>
            </h2>
            <p className="body-text text-gray-600 max-w-3xl mx-auto">
              {t("landing.features.sectionDescription")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="heading-feature text-lg text-gray-900 mb-2">
                {t("landing.features.feature1.title")}
              </h3>
              <p className="small-text text-gray-600">
                {t("landing.features.feature1.description")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="heading-feature text-lg text-gray-900 mb-2">
                {t("landing.features.feature2.title")}
              </h3>
              <p className="small-text text-gray-600">
                {t("landing.features.feature2.description")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="heading-feature text-lg text-gray-900 mb-2">
                {t("landing.features.feature3.title")}
              </h3>
              <p className="small-text text-gray-600">
                {t("landing.features.feature3.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-linear-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="heading-sub text-2xl sm:text-3xl lg:text-4xl text-white mb-4">
            {t("landing.cta.title")}
          </h2>
          <p className="body-text text-blue-100 max-w-2xl mx-auto mb-8">
            {t("landing.cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleUploadClick}
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg text-lg"
            >
              {t("upload.ctaButtons.checkCV")}
            </button>
            <button
              onClick={handleCreateCV}
              className="border-2 border-white text-white hover:bg-white/10 font-bold py-4 px-8 rounded-lg transition-all duration-200"
            >
              {t("upload.ctaButtons.createCV")}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Image
              src="/fastrezu-logo/trans_bg.png"
              alt="FastRezu Logo"
              width={24}
              height={24}
              className="w-6 h-6 object-contain"
            />
            <span className="text-white font-semibold">FastRezu</span>
          </div>
          <p className="small-text">{t("landing.footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
}
