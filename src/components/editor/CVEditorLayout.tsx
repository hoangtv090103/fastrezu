"use client";

import { useState, lazy, Suspense } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";
import WizardPanel from "@/components/editor/WizardPanel";
import { useRouter } from "next/navigation";

// Lazy load the preview component as it's heavy
const CVPreview = lazy(() => import("@/components/cv/CVPreview"));

export default function CVEditorLayout() {
  const { state } = useCVEditor();
  const { t } = useTranslation();
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const router = useRouter();

  if (state.isLoading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        suppressHydrationWarning
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="body-text text-gray-600">
            {t("editor.layout.loadingCV")}
          </p>
        </div>
      </div>
    );
  }

  if (state.error) {
    // Auto redirect to dashboard if CV not found
    if (state.error.includes("CV not found")) {
      router.push("/dashboard");
      return null;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <h2 className="heading-feature text-xl text-gray-900 mb-4">
            {t("editor.layout.errorLoadingCV")}
          </h2>
          <p className="body-text text-gray-600 mb-6">{state.error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-primary btn-text"
          >
            {t("editor.layout.backToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden relative">
        {/* Left Panel - Wizard */}
        <div className="wizard-panel-container w-full lg:w-1/2 bg-white border-r-0 lg:border-r border-gray-200 overflow-y-auto min-h-0">
          <WizardPanel />
        </div>

        {/* Mobile Preview Toggle Button - Edge Tab Design */}
        <button
          onClick={() => setShowMobilePreview(true)}
          className="lg:hidden fixed top-36 right-0 z-40 bg-gradient-to-l from-blue-500 to-blue-600 text-white px-2 py-4 rounded-l-full shadow-2xl flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all hover:px-3 active:scale-95"
          style={{
            boxShadow:
              "-4px 0 12px rgba(0, 0, 0, 0.15), -2px 0 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Mobile Preview Backdrop */}
        {showMobilePreview && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setShowMobilePreview(false)}
          />
        )}

        {/* Right Panel - Preview */}
        <div
          className={`
            fixed lg:static inset-y-0 right-0 z-50 w-[85%] lg:w-1/2 bg-gray-100 
            transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
            ${
              showMobilePreview
                ? "translate-x-0"
                : "translate-x-full lg:translate-x-0"
            }
            overflow-y-auto min-h-0 flex flex-col
          `}
        >
          {/* Mobile Preview Header */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-gray-900">Preview CV</h3>
            <button
              onClick={() => setShowMobilePreview(false)}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">
                      {t("editor.layout.loadingPreview")}
                    </p>
                  </div>
                </div>
              }
            >
              <CVPreview />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
