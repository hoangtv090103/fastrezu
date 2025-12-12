"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";
import PDFViewerWrapper from "@/components/cv/PDFViewerWrapper";
import FileUploadZone from "@/components/cv/FileUploadZone";
// import { parseMarkdown } from "@/lib/markdown"; // no longer used here
import { apiPost, apiPostFormData } from "@/lib/api-client";
import {
  trackCheckerFlowStarted,
  trackCheckerFileUploaded,
  trackCheckerTextCorrected,
  trackCheckerScoreGenerated,
} from "@/lib/analytics";
import { createClient } from "@/lib/supabase-client";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { getTooltipContent } from "@/lib/tooltip-content";
import { useTranslation } from "@/hooks/useTranslation";
import { getPendingCVAsFile, clearPendingCV } from "@/lib/pending-cv-storage";

interface ScoreResult {
  score: number;
  analysis: {
    keyword_match: number;
    formatting: number;
    completeness: number;
    relevance: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: Array<{
    suggestion_text: string;
    suggestion_type:
      | "add_keyword"
      | "improve_bullet"
      | "add_section"
      | "enhance_content";
    target_section: string;
    target_index: number | null;
    keyword: string | null;
    priority: "high" | "medium" | "low";
    original_content: unknown;
    suggested_content: unknown;
  }>;
  metadata: {
    hasJobDescription: boolean;
    textLength: number;
    language: string;
    timestamp: string;
  };
}

export default function CheckCVPage() {
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [isLoadingUpload, setIsLoadingUpload] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [originalText, setOriginalText] = useState(""); // Track original for analytics
  const [isConfirmingText, setIsConfirmingText] = useState(false);
  const [jdText, setJdText] = useState("");
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState<
    "upload" | "review" | "jd" | "results"
  >("upload");
  const [userId, setUserId] = useState<string | null>(null);
  const [autoUploadTriggered, setAutoUploadTriggered] = useState(false);
  const { t, locale } = useTranslation();

  // Track checker flow start, get user ID, and auto-load pending CV
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Track checker flow started
        try {
          trackCheckerFlowStarted({ userId: user.id });
        } catch (error) {
          console.error("Failed to track checker flow:", error);
        }
      }

      // Auto-load pending CV if coming from upload flow
      const fromUpload = searchParams.get("from_upload") === "true";
      if (fromUpload && !autoUploadTriggered) {
        const pendingFile = getPendingCVAsFile();
        if (pendingFile) {
          setFile(pendingFile);
          setAutoUploadTriggered(true);
          // Clear the pending CV from storage
          clearPendingCV();
          // Show success message
          showSuccessToast(
            'CV đã được tải lên thành công! Nhấn "Tải lên" để tiếp tục.'
          );
        }
      }
    };
    init();
  }, [searchParams, autoUploadTriggered, locale]);

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setError("");
    setScoreResult(null);
    setCurrentStep("upload");
  };

  const handleFileUpload = async () => {
    if (!file) {
      const errorMsg = t("checkCV.errors.selectFile");
      setError(errorMsg);
      showErrorToast(errorMsg, locale);
      return;
    }

    setIsLoadingUpload(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await apiPostFormData<{
        text: string;
        extractedText: string;
      }>("/api/cv/upload-check", formData, undefined, locale); // Keep the extracted text as-is; BlockNoteEditor will emit Markdown on edits
      setEditedText(data.extractedText || data.text);
      setOriginalText(data.extractedText || data.text); // Store original for tracking
      setCurrentStep("review");
      showSuccessToast(t("checkCV.success.uploaded"));

      // Track file upload
      if (userId) {
        try {
          trackCheckerFileUploaded({
            userId: userId,
            fileType: file.name.endsWith(".pdf") ? "pdf" : "docx",
            fileSizeKb: Math.round(file.size / 1024),
          });
        } catch (error) {
          console.error("Failed to track file upload:", error);
        }
      }
    } catch (err) {
      const appError = handleAPIError(err, "upload CV", locale);
      setError(appError.userMessage);
      showErrorToast(appError, locale);
    } finally {
      setIsLoadingUpload(false);
    }
  };

  const handleConfirmText = () => {
    if (!editedText.trim()) {
      const errorMsg = t("checkCV.errors.confirmTextFirst");
      setError(errorMsg);
      showErrorToast(errorMsg, locale);
      return;
    }
    setIsConfirmingText(true);
    setTimeout(() => {
      setIsConfirmingText(false);
      setCurrentStep("jd");
      showSuccessToast(t("checkCV.success.textConfirmed"));

      // Track text confirmation
      if (userId) {
        try {
          trackCheckerTextCorrected({
            userId: userId,
            textLengthOriginal: originalText.length,
            textLengthCorrected: editedText.length,
          });
        } catch (error) {
          console.error("Failed to track text correction:", error);
        }
      }
    }, 300);
  };

  const handleScoreCV = async () => {
    if (!editedText.trim()) {
      const errorMsg = t("checkCV.errors.confirmBeforeScore");
      setError(errorMsg);
      showErrorToast(errorMsg, locale);
      return;
    }

    setIsLoadingScore(true);
    setError("");

    try {
      const data = await apiPost<ScoreResult>(
        "/api/ai/score-uploaded-cv",
        {
          // editedText is Markdown emitted by the editor
          confirmedText: editedText,
          jdText: jdText.trim() || undefined,
          language: "vi",
        },
        {
          maxRetries: 3,
          backoffMs: 2000,
          timeoutMs: 180000,
          retryableStatuses: [429, 500, 502, 503, 504],
        },
        locale
      );

      setScoreResult(data);
      setCurrentStep("results");
      showSuccessToast(t("checkCV.success.scoreGenerated"));

      // Track score generation
      if (userId) {
        try {
          trackCheckerScoreGenerated({
            userId: userId,
            finalScore: data.score,
            withJD: !!jdText.trim(),
          });
        } catch (error) {
          console.error("Failed to track score generation:", error);
        }
      }
    } catch (err) {
      const appError = handleAPIError(err, "score CV", locale);

      // Check if it's a service unavailable error
      const errorMessage = err instanceof Error ? err.message : String(err);
      const is503Error =
        errorMessage.includes("503") ||
        errorMessage.includes("temporarily unavailable");

      if (is503Error) {
        const friendlyMessage = t("checkCV.errors.aiOverloaded");
        setError(friendlyMessage);
        showErrorToast(friendlyMessage, locale);
      } else {
        setError(appError.userMessage);
        showErrorToast(appError, locale);
      }
    } finally {
      setIsLoadingScore(false);
    }
  };

  const resetProcess = () => {
    setFile(null);
    setEditedText("");
    setJdText("");
    setScoreResult(null);
    setError("");
    setCurrentStep("upload");
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {t("checkCV.title")}
              </h1>
              <p className="text-sm sm:text-base text-gray-700">
                {t("checkCV.subtitle")}
              </p>
            </div>

            {/* Compact Step Indicator */}
            <div className="flex items-center space-x-1 sm:space-x-2 ml-4">
              {[
                { key: "upload", label: t("checkCV.steps.upload"), icon: "📁" },
                { key: "review", label: t("checkCV.steps.review"), icon: "✏️" },
                { key: "jd", label: t("checkCV.steps.jd"), icon: "📋" },
                {
                  key: "results",
                  label: t("checkCV.steps.results"),
                  icon: "📊",
                },
              ].map((step, index) => (
                <div key={step.key} className="relative group">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      currentStep === step.key
                        ? "bg-blue-600 text-white shadow-lg"
                        : ["upload", "review", "jd", "results"].indexOf(
                            currentStep
                          ) > index
                        ? "bg-green-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {["upload", "review", "jd", "results"].indexOf(
                      currentStep
                    ) > index
                      ? "✓"
                      : step.icon}
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {step.label}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>

                  {/* Connector line */}
                  {index < 3 && (
                    <div
                      className={`absolute top-1/2 left-full w-2 sm:w-4 h-0.5 transform -translate-y-1/2 ${
                        ["upload", "review", "jd", "results"].indexOf(
                          currentStep
                        ) > index
                          ? "bg-green-500"
                          : "bg-gray-100"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-500 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Step 1: Upload */}
        {currentStep === "upload" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("checkCV.uploadFileLabel")}
              </label>
              <FileUploadZone
                file={file}
                onFileSelect={handleFileChange}
                accept=".pdf,.docx"
                maxSizeMB={10}
                disabled={isLoadingUpload}
              />
            </div>

            <button
              onClick={handleFileUpload}
              disabled={!file || isLoadingUpload}
              className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoadingUpload
                ? t("checkCV.uploading")
                : t("checkCV.uploadButton")}
            </button>
          </div>
        )}

        {/* Step 2: Review Text */}
        {currentStep === "review" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("checkCV.review.title")}
              </label>
              <p className="text-sm text-gray-600 mb-4">
                {t("checkCV.review.description")}
              </p>
            </div>

            {/* PDF Viewer with responsive split layout */}
            <div className="border border-gray-300 rounded-lg overflow-hidden h-[500px] sm:h-[600px] lg:h-[700px]">
              <PDFViewerWrapper
                file={file}
                extractedText={editedText}
                onTextChange={setEditedText}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setCurrentStep("upload")}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm sm:text-base"
              >
                {t("common.back")}
              </button>
              <button
                onClick={handleConfirmText}
                disabled={!editedText.trim() || isConfirmingText}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base"
              >
                {isConfirmingText ? t("checkCV.confirming") : t("common.next")}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Job Description */}
        {currentStep === "jd" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("checkCV.addJDLabel")}
              </label>
              <p className="text-sm text-gray-700 mb-4">{t("checkCV.addJD")}</p>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full h-48 p-4 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder={t("checkCV.addJDPlaceholder")}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setCurrentStep("review")}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm sm:text-base"
              >
                {t("common.back")}
              </button>
              <button
                onClick={handleScoreCV}
                disabled={isLoadingScore}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 text-sm sm:text-base"
              >
                {isLoadingScore
                  ? t("checkCV.scoring")
                  : t("checkCV.generateScore")}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === "results" && scoreResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {scoreResult.score}/100
              </div>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {t("checkCV.atsScore")}
                </h2>
                <InfoTooltip
                  id="ats-score-check-cv"
                  title={getTooltipContent("ats_score_meaning", locale).title}
                  content={
                    getTooltipContent("ats_score_meaning", locale).content
                  }
                  placement="bottom"
                  icon="info"
                  dismissible={true}
                />
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {scoreResult.analysis.keyword_match}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="text-xs sm:text-sm text-gray-700">
                    {t("checkCV.keywordMatch")}
                  </div>
                  <InfoTooltip
                    id="keyword-match-check-cv"
                    title={
                      getTooltipContent("keyword_match_meaning", locale).title
                    }
                    content={
                      getTooltipContent("keyword_match_meaning", locale).content
                    }
                    placement="bottom"
                    icon="info"
                    dismissible={true}
                  />
                </div>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-500">
                  {scoreResult.analysis.formatting}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="text-xs sm:text-sm text-gray-700">
                    {t("checkCV.formatting")}
                  </div>
                  <InfoTooltip
                    id="formatting-check-cv"
                    title={
                      getTooltipContent("formatting_meaning", locale).title
                    }
                    content={
                      getTooltipContent("formatting_meaning", locale).content
                    }
                    placement="bottom"
                    icon="info"
                    dismissible={true}
                  />
                </div>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                <div className="text-xl sm:text-2xl font-bold text-yellow-500">
                  {scoreResult.analysis.completeness}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="text-xs sm:text-sm text-gray-700">
                    {t("checkCV.completeness")}
                  </div>
                  <InfoTooltip
                    id="completeness-check-cv"
                    title={
                      getTooltipContent("completeness_meaning", locale).title
                    }
                    content={
                      getTooltipContent("completeness_meaning", locale).content
                    }
                    placement="bottom"
                    icon="info"
                    dismissible={true}
                  />
                </div>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {scoreResult.analysis.relevance}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="text-xs sm:text-sm text-gray-700">
                    {t("checkCV.relevance")}
                  </div>
                  <InfoTooltip
                    id="relevance-check-cv"
                    title={getTooltipContent("relevance_meaning", locale).title}
                    content={
                      getTooltipContent("relevance_meaning", locale).content
                    }
                    placement="bottom"
                    icon="info"
                    dismissible={true}
                  />
                </div>
              </div>
            </div>

            {/* Keywords */}
            {scoreResult.matchedKeywords.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("checkCV.matchedKeywords")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scoreResult.matchedKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-500 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {scoreResult.missingKeywords.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("checkCV.missingKeywords")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scoreResult.missingKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-100 text-red-500 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {scoreResult.suggestions && scoreResult.suggestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t("checkCV.suggestions")}
                </h3>
                <div className="space-y-3">
                  {scoreResult.suggestions.map((suggestion, index) => {
                    const getPriorityColor = (priority: string) => {
                      switch (priority) {
                        case "high":
                          return "bg-red-100 text-red-500 border-red-500";
                        case "medium":
                          return "bg-yellow-100 text-yellow-500 border-yellow-500";
                        case "low":
                          return "bg-blue-100 text-blue-600 border-blue-600";
                        default:
                          return "bg-gray-100 text-gray-800 border-gray-300";
                      }
                    };

                    const getPriorityLabel = (priority: string) => {
                      const labels = {
                        high: t("checkCV.priority.high"),
                        medium: t("checkCV.priority.medium"),
                        low: t("checkCV.priority.low"),
                      };
                      return (
                        labels[priority as keyof typeof labels] || priority
                      );
                    };

                    return (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                                  suggestion.priority
                                )}`}
                              >
                                {getPriorityLabel(suggestion.priority)}
                              </span>
                              {suggestion.keyword && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-500 border border-green-500">
                                  🎯 {suggestion.keyword}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">
                              {suggestion.suggestion_text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-500 rounded-lg p-4">
              <p className="text-sm text-yellow-500">
                <strong>{t("checkCV.disclaimer.note")}</strong>{" "}
                {t("checkCV.disclaimer.message")}
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={resetProcess}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                {t("checkCV.startOver")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
