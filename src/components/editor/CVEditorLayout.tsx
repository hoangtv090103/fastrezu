"use client";

import { useCVEditor } from "@/contexts/CVEditorContext";
import WizardPanel from "@/components/editor/WizardPanel";
import CVPreview from "@/components/cv/CVPreview";
import AutoSaveIndicator from "@/components/editor/AutoSaveIndicator";
import { useRouter } from "next/navigation";

export default function CVEditorLayout() {
  const { state } = useCVEditor();
  const router = useRouter();

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" suppressHydrationWarning>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="body-text text-gray-600">Đang tải CV...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    // Auto redirect to dashboard if CV not found
    if (state.error.includes('CV not found')) {
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
            Lỗi tải CV
          </h2>
          <p className="body-text text-gray-600 mb-6">
            {state.error}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-primary btn-text"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-gray-600 hover:text-gray-800 small-text transition-colors duration-200"
            >
              ← Về Dashboard
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="heading-feature text-lg text-gray-900">
              {state.cvData?.title || "CV Editor"}
            </h1>
          </div>
          <AutoSaveIndicator />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Left Panel - Wizard */}
        <div className="w-full lg:w-2/5 bg-white border-r-0 lg:border-r border-gray-200 overflow-y-auto max-h-[50vh] lg:max-h-none">
          <WizardPanel />
        </div>

        {/* Right Panel - Preview */}
        <div className="w-full lg:w-3/5 bg-gray-100 overflow-y-auto max-h-[50vh] lg:max-h-none">
          <CVPreview />
        </div>
      </div>
    </div>
  );
}
