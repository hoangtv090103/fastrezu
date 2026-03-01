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
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100/50">
        <div className="container mx-auto px-4 max-w-7xl">
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
              <span className="heading-feature text-xl text-gray-900 tracking-tight">
                {t("landing.header.brandName")}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={handleCreateCV}
                className="hidden sm:inline-flex px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium transition-all duration-200 rounded-full shadow-md hover:shadow-lg cursor-pointer text-sm items-center justify-center transform hover:-translate-y-0.5"
              >
                {t("auth.login")}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-indigo-50/80 via-white to-blue-50/80">
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left Column - Text */}
            <div className="text-center lg:text-left animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                AI-Powered ATS Optimization
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-[1.15] tracking-tight">
                {t("landing.hero.title")}
                <span className="block text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600 mt-2 pb-1">
                  {t("landing.hero.titleHighlight")}
                </span>
                <span className="block text-gray-800 mt-1">
                  {t("landing.hero.titleAction")}
                </span>
              </h1>
              <p className="body-text text-gray-600 text-lg sm:text-xl mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
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
              className="animate-fade-in-up relative"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="absolute inset-0 bg-linear-to-br from-blue-200/20 to-indigo-200/20 rounded-4xl blur-2xl transform scale-105"></div>
              <div className="relative bg-white/90 backdrop-blur-xl rounded-4xl shadow-xl p-8 sm:p-10 border border-gray-100/80">
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                    {t("landing.uploadWidget.heading")}
                  </h2>
                  <p className="text-gray-500 font-medium">
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
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 cursor-pointer transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/50 scale-[1.02]"
                      : "border-gray-200 hover:border-blue-400 hover:bg-gray-50/50"
                  } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
                >
                  <div className="flex flex-col items-center">
                    {/* Upload Icon / Loading */}
                    <div className="mb-6 p-5 bg-linear-to-br from-blue-50 to-indigo-50 rounded-2xl group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
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
                    <span className="inline-flex items-center justify-center px-8 py-3 mb-4 text-base font-semibold text-white bg-gray-900 rounded-full pointer-events-none shadow-md">
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

                    <div className="mt-6 flex items-center gap-3">
                      <span className="px-3 py-1 bg-white border border-gray-100 shadow-sm text-gray-500 text-xs font-bold tracking-wider rounded-md">
                        PDF
                      </span>
                      <span className="px-3 py-1 bg-white border border-gray-100 shadow-sm text-gray-500 text-xs font-bold tracking-wider rounded-md">
                        DOCX
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-medium text-gray-600">
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
      <section className="py-12 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <p className="text-center text-sm font-semibold tracking-wider text-gray-400 uppercase mb-8">
            {t("landing.companies.title")}
          </p>
          <CompanyCarousel />
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 md:py-28 bg-gray-50/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-50/40 via-transparent to-transparent pointer-events-none"></div>
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              {t("landing.painPoints.sectionTitle")}
              <span className="block mt-2 pb-1 bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-blue-500">
                {t("landing.painPoints.sectionTitleBreak")}
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t("landing.painPoints.sectionDescription")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {/* Pain 1 */}
            <div className="group bg-white/60 backdrop-blur-sm rounded-4xl p-8 lg:p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-red-100/50 hover:bg-red-50/30">
              <div className="w-14 h-14 bg-red-100/60 rounded-2xl flex items-center justify-center mb-6 text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
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
              <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight group-hover:text-red-700 transition-colors">
                {t("landing.painPoints.pain1.title")}
              </h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                {t("landing.painPoints.pain1.description")}
              </p>
            </div>

            {/* Pain 2 */}
            <div className="group bg-white/60 backdrop-blur-sm rounded-4xl p-8 lg:p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-orange-100/50 hover:bg-orange-50/30">
              <div className="w-14 h-14 bg-orange-100/60 rounded-2xl flex items-center justify-center mb-6 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
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
              <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight group-hover:text-orange-700 transition-colors">
                {t("landing.painPoints.pain2.title")}
              </h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                {t("landing.painPoints.pain2.description")}
              </p>
            </div>

            {/* Pain 3 */}
            <div className="group bg-white/60 backdrop-blur-sm rounded-4xl p-8 lg:p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-yellow-100/50 hover:bg-yellow-50/30">
              <div className="w-14 h-14 bg-yellow-100/60 rounded-2xl flex items-center justify-center mb-6 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition-colors duration-300">
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
              <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight group-hover:text-yellow-700 transition-colors">
                {t("landing.painPoints.pain3.title")}
              </h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                {t("landing.painPoints.pain3.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-white relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-blue-50/30 via-white to-white pointer-events-none"></div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              {t("landing.features.sectionTitle")}
              <span className="block mt-2 bg-clip-text text-transparent bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 pb-1">
                {t("landing.features.sectionTitleBreak")}
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t("landing.features.sectionDescription")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {/* Feature 1 */}
            <div className="relative group rounded-4xl p-8 lg:p-10 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 rounded-4xl border-2 border-transparent group-hover:border-blue-100 transition-colors duration-300 pointer-events-none"></div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <svg
                  className="w-6 h-6"
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
              <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
                {t("landing.features.feature1.title")}
              </h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                {t("landing.features.feature1.description")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="relative group rounded-4xl p-8 lg:p-10 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 rounded-4xl border-2 border-transparent group-hover:border-emerald-100 transition-colors duration-300 pointer-events-none"></div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <svg
                  className="w-6 h-6"
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
              <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
                {t("landing.features.feature2.title")}
              </h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                {t("landing.features.feature2.description")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="relative group rounded-4xl p-8 lg:p-10 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100">
              <div className="absolute inset-0 rounded-4xl border-2 border-transparent group-hover:border-purple-100 transition-colors duration-300 pointer-events-none"></div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8 bg-linear-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <svg
                  className="w-6 h-6"
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
              <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
                {t("landing.features.feature3.title")}
              </h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                {t("landing.features.feature3.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 my-10 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="relative rounded-4xl overflow-hidden bg-gray-900 shadow-2xl">
            {/* Minimalistic CTA Effects */}
            <div className="absolute inset-0 bg-linear-to-br from-indigo-900/40 via-blue-900/30 to-purple-900/40"></div>

            <div className="relative z-10 px-8 py-20 md:py-24 text-center">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight max-w-3xl mx-auto leading-tight">
                {t("landing.cta.title")}
              </h2>
              <p className="text-lg text-indigo-100 max-w-2xl mx-auto mb-10 leading-relaxed font-medium opacity-90">
                {t("landing.cta.description")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <button
                  onClick={handleUploadClick}
                  className="w-full sm:w-auto px-10 py-4.5 text-lg font-bold text-gray-900 bg-white hover:bg-gray-50 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
                >
                  {t("upload.ctaButtons.checkCV")}
                </button>
                <button
                  onClick={handleCreateCV}
                  className="w-full sm:w-auto px-10 py-4.5 text-lg font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/40 inline-flex items-center justify-center gap-2"
                >
                  {t("upload.ctaButtons.createCV")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100 mt-10">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col items-center justify-center text-center">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
              <Image
                src="/fastrezu-logo/trans_bg.png"
                alt="FastRezu Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
              />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
              FastRezu
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500">
            {t("landing.footer.copyright")}
          </p>
        </div>
      </footer>
    </div>
  );
}
