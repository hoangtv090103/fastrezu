"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";
import AIAssistButton from "@/components/ui/AIAssistButton";
import { apiPost } from "@/lib/api-client";
import { handleAPIError } from "@/lib/error-handler";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";

export default function SummaryStep() {
  const { state, updateSection } = useCVEditor();
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);

  const summaryData = (state.cvData?.sections.summary || {}) as Record<
    string,
    unknown
  >;
  const summary = {
    content: typeof summaryData.content === "string" ? summaryData.content : "",
  };

  const handleInputChange = (value: string) => {
    updateSection("summary", {
      ...summaryData,
      content: value,
    });
  };

  const handleGenerateWithAI = async () => {
    // Validate personal info exists and has full_name
    const personalInfo = state.cvData?.sections.personal_info;
    // Type guard: ensure personalInfo is an object (not an array) and has full_name
    if (!personalInfo || Array.isArray(personalInfo)) {
      showErrorToast(
        "Họ và tên không được để trống. Vui lòng điền họ và tên trong phần thông tin cá nhân trước khi tạo tóm tắt.",
        "vi"
      );
      return;
    }
    const personalInfoObj = personalInfo as Record<string, unknown>;
    if (
      !personalInfoObj.full_name ||
      typeof personalInfoObj.full_name !== "string" ||
      personalInfoObj.full_name.trim() === ""
    ) {
      showErrorToast(
        "Họ và tên không được để trống. Vui lòng điền họ và tên trong phần thông tin cá nhân trước khi tạo tóm tắt.",
        "vi"
      );
      return;
    }

    setIsGenerating(true);
    try {
      const result = await apiPost<{ summary: string }>(
        "/api/ai/generate-summary",
        {
          personalInfo: personalInfoObj,
          experience: state.cvData?.sections.experience,
          jdKeywords: state.cvData?.jd_analysis?.keywords,
          language: state.cvData?.language || "vi",
        },
        undefined,
        "vi"
      );

      handleInputChange(result.summary);
      showSuccessToast("Đã tạo tóm tắt nghề nghiệp thành công!");
    } catch (error) {
      console.error("Error generating summary:", error);
      const appError = handleAPIError(error, "generate summary", "vi");
      showErrorToast(appError, "vi");
    } finally {
      setIsGenerating(false);
    }
  };

  const characterCount = summary.content.length;
  const isOptimalLength = characterCount >= 200 && characterCount <= 500;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          {t("editor.summary.title")}
        </h3>
        <p className="body-text text-gray-600 mb-4">
          {t("editor.summary.description")}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="summary"
              className="block text-sm font-medium text-gray-700"
            >
              {t("editor.summary.label")}
            </label>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs ${
                  isOptimalLength ? "text-green-600" : "text-gray-500"
                }`}
              >
                {characterCount}/500 ký tự
              </span>
              {isOptimalLength && (
                <span className="text-xs text-green-600">✓</span>
              )}
            </div>
          </div>
          <textarea
            id="summary"
            value={summary.content}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t("editor.summary.placeholder")}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Khuyến nghị: 200-500 ký tự để tối ưu cho ATS
          </p>
        </div>

        <AIAssistButton
          onClick={handleGenerateWithAI}
          loading={isGenerating}
          label={t("editor.summary.generate")}
          disabled={!state.cvData || !state.cvData.sections.personal_info}
        />

        {state.cvData?.jd_analysis?.keywords && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              {t("editor.summary.aiNote")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
