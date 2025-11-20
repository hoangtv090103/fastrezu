"use client";

import { useState, useEffect, useCallback } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";
import AIAssistButton from "@/components/ui/AIAssistButton";
import KeywordTag from "@/components/ui/KeywordTag";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";
import { getTooltipContent } from "@/lib/tooltip-content";
import { apiPost, apiDelete, apiGet } from "@/lib/api-client";

interface SavedJD {
  id: string;
  jdText: string;
  keywords: string[];
  analysis: Record<string, unknown>;
  createdAt: string;
  preview: string;
}

export default function JDAnalysisStep() {
  const { state, setJDAnalysis } = useCVEditor();
  const { t, locale } = useTranslation();
  const [jdText, setJdText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedJDs, setSavedJDs] = useState<SavedJD[]>([]);
  const [isLoadingJDs, setIsLoadingJDs] = useState(false);

  const loadSavedJDs = useCallback(async () => {
    if (!state.cvData?.id) return;

    setIsLoadingJDs(true);
    try {
      const { jdAnalyses } = await apiGet<{ jdAnalyses: SavedJD[] }>(
        `/api/jd/list?cvId=${state.cvData.id}`
      );
      setSavedJDs(jdAnalyses);
    } catch (error) {
      console.error("Error loading saved JDs:", error);
    } finally {
      setIsLoadingJDs(false);
    }
  }, [state.cvData?.id]);

  // Load saved JDs when component mounts
  useEffect(() => {
    if (state.cvData?.id) {
      loadSavedJDs();
    }
  }, [state.cvData?.id, loadSavedJDs]);

  const handleDeleteJD = async (jdId: string) => {
    try {
      await apiDelete(`/api/jd/delete?jdId=${jdId}`, undefined, "vi");
      setSavedJDs((prev) => prev.filter((jd) => jd.id !== jdId));
      showSuccessToast("Đã xóa JD thành công!");
    } catch (error) {
      console.error("Error deleting JD:", error);
      const appError = handleAPIError(error, "delete JD", "vi");
      showErrorToast(appError, "vi");
    }
  };

  const handleUseSavedJD = (savedJD: SavedJD) => {
    setJdText(savedJD.jdText);
    setKeywords(savedJD.keywords);
    setJDAnalysis(savedJD.keywords, savedJD.analysis);
  };

  const handleAnalyzeJD = async () => {
    if (!jdText.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await apiPost<{ ats_keywords: string[] }>(
        "/api/ai/analyze-jd",
        {
          jdText,
          cvId: state.cvData?.id,
          language: state.cvData?.language || "vi",
        },
        undefined,
        "vi"
      );

      // Extract keywords from the analysis response
      const extractedKeywords = analysis.ats_keywords || [];

      if (!Array.isArray(extractedKeywords)) {
        throw new Error("Invalid response format from AI service");
      }

      setKeywords(extractedKeywords);
      setJDAnalysis(extractedKeywords, analysis);

      // Reload saved JDs to show the newly saved one
      loadSavedJDs();
      showSuccessToast("Phân tích JD thành công!");
    } catch (error) {
      console.error("Error analyzing JD:", error);
      const appError = handleAPIError(error, "analyze JD", "vi");
      setError(appError.userMessage);
      showErrorToast(appError, "vi");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Always use Vietnamese for tooltips
  const tooltipContent = getTooltipContent("jd_analysis_importance", locale);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-start gap-2 mb-2">
          <h3 className="heading-feature text-base sm:text-lg text-gray-900">
            {t("editor.jdAnalysis.title")}
          </h3>
          <div className="mt-0.5">
            <InfoTooltip
              id="jd-analysis-importance"
              title={tooltipContent.title}
              content={tooltipContent.content}
              placement="bottom"
              icon="info"
            />
          </div>
        </div>
        <p className="body-text text-gray-600 mb-4 text-sm sm:text-base">
          {t("editor.jdAnalysis.description")}
        </p>
      </div>

      <div className="space-y-4">
        {/* Saved JDs Section */}
        {isLoadingJDs ? (
          <div className="mb-4 sm:mb-6">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">
              JD đã lưu
            </h4>
            <div className="space-y-2">
              {/* Loading skeleton */}
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border animate-pulse"
                >
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-3">
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : savedJDs.length > 0 ? (
          <div className="mb-4 sm:mb-6">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">
              {t("editor.jdAnalysis.savedJDs")}
            </h4>
            <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
              {savedJDs.map((savedJD) => (
                <div
                  key={savedJD.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-900 truncate">
                      {savedJD.preview}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(savedJD.createdAt).toLocaleDateString("vi-VN")}{" "}
                      • {savedJD.keywords.length}{" "}
                      {t("editor.jdAnalysis.keywords")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-3">
                    <button
                      onClick={() => handleUseSavedJD(savedJD)}
                      className="px-2 sm:px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {t("editor.jdAnalysis.use")}
                    </button>
                    <button
                      onClick={() => handleDeleteJD(savedJD.id)}
                      className="px-2 sm:px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      {t("editor.jdAnalysis.delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <label
            htmlFor="jd-text"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t("editor.jdAnalysis.label")}
          </label>
          <textarea
            id="jd-text"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder={t("editor.jdAnalysis.placeholder")}
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
          />
        </div>

        <AIAssistButton
          onClick={handleAnalyzeJD}
          loading={isAnalyzing}
          label={t("editor.jdAnalysis.analyze")}
          disabled={!jdText.trim()}
        />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="shrink-0">
                <span className="text-red-600 text-lg">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">
                  {t("editor.jdAnalysis.analysisError")}
                </p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  {t("editor.jdAnalysis.close")}
                </button>
              </div>
            </div>
          </div>
        )}

        {keywords && keywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {t("editor.jdAnalysis.extractedKeywords")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <KeywordTag key={index} keyword={keyword} />
              ))}
            </div>
          </div>
        )}

        {/* {state.cvData?.jd_analysis && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="shrink-0">
                <span className="text-green-600 text-lg">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">
                  {t('editor.jdAnalysis.analyzeSuccess')}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {t('editor.jdAnalysis.successMessage')}
                </p>
                <p className="mt-2 text-xs sm:text-sm text-green-700">
                  {t('editor.jdAnalysis.nextStep')}
                </p>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
