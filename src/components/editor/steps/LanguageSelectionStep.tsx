"use client";

import { useState, useEffect } from "react";
import { useCVEditor, CVLanguage } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { getTooltipContent } from "@/lib/tooltip-content";

export default function LanguageSelectionStep() {
  const { state, setLanguage } = useCVEditor();
  const { t, locale } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<CVLanguage | null>(
    null
  );

  // Initialize with existing language if available
  useEffect(() => {
    if (state.cvData?.language) {
      setSelectedLanguage(state.cvData.language);
    }
  }, [state.cvData?.language]);

  const handleLanguageSelect = (language: CVLanguage) => {
    setSelectedLanguage(language);
    setLanguage(language);
  };

  const tooltipContent = getTooltipContent("language_selection", locale);

  return (
    <div className="p-4 sm:p-6 h-full">
      <div className="mb-6">
        <div className="flex items-start gap-2 mb-2">
          <h3 className="heading-feature text-lg text-gray-900">
            {t("editor.languageSelection.title")}
          </h3>
          <div className="mt-0.5">
            <InfoTooltip
              id="language-selection"
              title={tooltipContent.title}
              content={tooltipContent.content}
              placement="bottom"
              icon="info"
            />
          </div>
        </div>
        <p className="body-text text-gray-600 mb-4">
          {t("editor.languageSelection.description")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Vietnamese Option */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
            selectedLanguage === "vi"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => handleLanguageSelect("vi")}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                selectedLanguage === "vi"
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300"
              }`}
            >
              {selectedLanguage === "vi" && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {t("editor.languageSelection.vietnamese")}
              </h4>
              <p className="text-sm text-gray-600">
                {t("dashboard.createInVietnamese")}
              </p>
            </div>
            <div className="ml-auto text-2xl font-semibold text-gray-500">
              VN
            </div>
          </div>
        </div>

        {/* English Option */}
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
            selectedLanguage === "en"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
          onClick={() => handleLanguageSelect("en")}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                selectedLanguage === "en"
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300"
              }`}
            >
              {selectedLanguage === "en" && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {t("editor.languageSelection.english")}
              </h4>
              <p className="text-sm text-gray-600">
                {t("dashboard.createInEnglish")}
              </p>
            </div>
            <div className="ml-auto text-2xl font-semibold text-gray-500">
              EN
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <div className="shrink-0">
            <span className="text-blue-600 text-lg">i️</span>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-700 mb-1">
              {t("editor.languageSelection.importantNote")}
            </h4>
            <p className="text-sm text-blue-600">
              {t("editor.languageSelection.noteDescription")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
