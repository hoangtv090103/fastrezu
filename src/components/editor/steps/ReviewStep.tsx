"use client";

import { useState, useEffect, useCallback } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";
import AIAssistButton from "@/components/ui/AIAssistButton";
import KeywordTag from "@/components/ui/KeywordTag";
import ATSOptimizationPanel from "@/components/editor/ATSOptimizationPanel";
import InfoTooltip from "@/components/ui/InfoTooltip";
import ValidationMessage from "@/components/ui/ValidationMessage";
import { validateCVLength, type CVData } from "@/lib/validation";
import { apiPost, type RetryConfig } from "@/lib/api-client";
import { handleAPIError } from "@/lib/error-handler";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import { getTooltipContent } from "@/lib/tooltip-content";

interface StructuredSuggestion {
  suggestion_text: string;
  suggestion_type: string;
  target_section: string;
  target_index?: number | null;
  keyword?: string | null;
  priority: "high" | "medium" | "low";
  original_content: unknown;
  suggested_content: unknown;
}

interface ScoringResult {
  score: number;
  suggestions: StructuredSuggestion[];
  analysis: {
    keyword_match: number;
    formatting: number;
    completeness: number;
    relevance: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
}

export default function ReviewStep() {
  const { state, updateCVData, saveCV } = useCVEditor();
  const { t, locale } = useTranslation();
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(
    null
  );
  const [isScoring, setIsScoring] = useState(false);
  const [lengthWarning, setLengthWarning] = useState<string | null>(null);
  const [suggestionsReloadTrigger, setSuggestionsReloadTrigger] = useState(0);

  // Validate CV length
  useEffect(() => {
    if (state.cvData) {
      const language = state.cvData.language || "vi";

      // Helper to safely convert to string array
      const toStringArray = (value: unknown): string[] => {
        if (Array.isArray(value)) {
          return value.filter((item) => typeof item === "string") as string[];
        }
        return [];
      };

      const cvData: CVData = {
        personal_info: state.cvData.sections
          .personal_info as CVData["personal_info"],
        summary: (typeof state.cvData.sections.summary === "string"
          ? state.cvData.sections.summary
          : "") as string,
        experience: (Array.isArray(state.cvData.sections.experience)
          ? state.cvData.sections.experience
          : []) as CVData["experience"],
        education: (Array.isArray(state.cvData.sections.education)
          ? state.cvData.sections.education
          : []) as CVData["education"],
        projects: (Array.isArray(state.cvData.sections.projects)
          ? state.cvData.sections.projects
          : []) as CVData["projects"],
        skills: toStringArray(state.cvData.sections.skills),
        certifications: (Array.isArray(state.cvData.sections.certifications)
          ? state.cvData.sections.certifications
          : []) as CVData["certifications"],
      };

      const result = validateCVLength(cvData, language);
      if (result.warnings && result.warnings.length > 0) {
        setLengthWarning(result.warnings[0]);
      } else {
        setLengthWarning(null);
      }
    }
  }, [state.cvData]);

  // Initialize scoring result from existing CV data if available
  useEffect(() => {
    if (
      state.cvData?.ats_score &&
      state.cvData?.ats_analysis &&
      !scoringResult
    ) {
      // Convert string[] suggestions to StructuredSuggestion[] if needed
      const suggestions = state.cvData.ats_analysis.suggestions || [];
      const structuredSuggestions: StructuredSuggestion[] =
        Array.isArray(suggestions) &&
        suggestions.length > 0 &&
        typeof suggestions[0] === "string"
          ? (suggestions as string[]).map((s: string) => ({
              suggestion_text: s,
              suggestion_type: "improve_content",
              target_section: "experience",
              target_index: null,
              keyword: null,
              priority: "medium" as const,
              original_content: null,
              suggested_content: null,
            }))
          : (suggestions as unknown as StructuredSuggestion[]);

      setScoringResult({
        score: state.cvData.ats_score,
        suggestions: structuredSuggestions,
        analysis: {
          keyword_match: state.cvData.ats_analysis.keyword_match || 0,
          formatting: state.cvData.ats_analysis.formatting || 0,
          completeness: state.cvData.ats_analysis.completeness || 0,
          relevance: state.cvData.ats_analysis.relevance || 0,
        },
        matchedKeywords: state.cvData.ats_analysis.matched_keywords || [],
        missingKeywords: state.cvData.ats_analysis.missing_keywords || [],
      });
    }
  }, [state.cvData?.ats_score, state.cvData?.ats_analysis, scoringResult]);

  const handleScoreCV = useCallback(async () => {
    if (!state.cvData) return;

    setIsScoring(true);
    try {
      // Deactivate old suggestions before scoring
      if (state.cvData.id) {
        try {
          await apiPost(
            `/api/cv/deactivate-suggestions/${state.cvData.id}`,
            {},
            undefined,
            "vi"
          );
        } catch (error) {
          console.error("Failed to deactivate old suggestions:", error);
          // Continue with scoring even if deactivation fails
        }
      }

      // Custom retry config with extended timeout for AI scoring (can take up to 2 minutes)
      const scoreRetryConfig: RetryConfig = {
        maxRetries: 2,
        backoffMs: 1000,
        timeoutMs: 120000, // 120 seconds (2 minutes) for AI processing
        retryableStatuses: [429, 500, 502, 503, 504],
      };

      const result = await apiPost<{
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
          suggestion_type: string;
          target_section: string;
          target_index?: number | null;
          keyword?: string | null;
          priority: "high" | "medium" | "low";
          original_content: unknown;
          suggested_content: unknown;
        }>;
      }>(
        "/api/ai/score-cv",
        {
          cvData: state.cvData,
          jdKeywords: state.cvData.jd_analysis?.keywords || [],
          language: state.cvData?.language || "vi",
          mode: state.cvData.jd_analysis?.mode || "real",
        },
        scoreRetryConfig,
        "vi"
      );

      // Validate and normalize the result
      const normalizedResult = {
        score: Math.round(result.score || 0),
        analysis: {
          keyword_match: Math.min(
            100,
            Math.max(0, Math.round(result.analysis?.keyword_match || 0))
          ),
          formatting: Math.min(
            100,
            Math.max(0, Math.round(result.analysis?.formatting || 0))
          ),
          completeness: Math.min(
            100,
            Math.max(0, Math.round(result.analysis?.completeness || 0))
          ),
          relevance: Math.min(
            100,
            Math.max(0, Math.round(result.analysis?.relevance || 0))
          ),
        },
        matchedKeywords: result.matchedKeywords || [],
        missingKeywords: result.missingKeywords || [],
        suggestions: result.suggestions || [],
      };

      console.log("ATS Scoring Result:", normalizedResult);
      setScoringResult(normalizedResult);

      // Update CV data with ATS score and analysis
      if (state.cvData && normalizedResult.score !== undefined) {
        const updatedCVData = {
          ...state.cvData,
          ats_score: normalizedResult.score,
          ats_analysis: {
            keyword_match: normalizedResult.analysis.keyword_match,
            formatting: normalizedResult.analysis.formatting,
            completeness: normalizedResult.analysis.completeness,
            relevance: normalizedResult.analysis.relevance,
            matched_keywords: normalizedResult.matchedKeywords,
            missing_keywords: normalizedResult.missingKeywords,
            suggestions: normalizedResult.suggestions.map(
              (s) => s.suggestion_text
            ),
          },
        };

        // Update context with new data
        updateCVData(updatedCVData);

        // Save to database
        try {
          await saveCV();
        } catch (error) {
          console.error("Failed to save ATS score to database:", error);
        }

        // Save structured suggestions to database
        if (
          state.cvData.id &&
          normalizedResult.suggestions &&
          normalizedResult.suggestions.length > 0
        ) {
          try {
            console.log("Saving suggestions to DB:", {
              cvId: state.cvData.id,
              suggestionsCount: normalizedResult.suggestions.length,
              suggestions: normalizedResult.suggestions.map((s, i) => ({
                index: i,
                suggestion_id: `suggestion-${i}`,
                suggestion_text: s.suggestion_text,
                target_section: s.target_section,
              })),
            });

            try {
              await apiPost(
                "/api/cv/save-suggestions",
                {
                  cvId: state.cvData.id,
                  suggestions: normalizedResult.suggestions,
                },
                undefined,
                "vi"
              );
              console.log("Suggestions saved successfully");
              setSuggestionsReloadTrigger((prev) => prev + 1);
            } catch (error) {
              console.error("Failed to save suggestions:", error);
            }
          } catch (error) {
            console.error("Failed to save suggestions to database:", error);
            // Don't fail the whole flow if saving suggestions fails
          }
        }
      }
    } catch (error) {
      console.error("Error scoring CV:", error);
      const appError = handleAPIError(error, "score CV", "vi");
      showErrorToast(appError, "vi");
    } finally {
      setIsScoring(false);
    }
  }, [state.cvData, updateCVData, saveCV]);

  // Auto-score when component mounts if we have JD analysis but no existing ATS score
  useEffect(() => {
    if (
      state.cvData?.jd_analysis &&
      !scoringResult &&
      !state.cvData?.ats_score
    ) {
      handleScoreCV();
    }
  }, [
    state.cvData?.jd_analysis,
    state.cvData?.ats_score,
    handleScoreCV,
    scoringResult,
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  // Detect mode for conditional rendering
  const mode = state.cvData?.jd_analysis?.mode || "real";
  const isShadowMode = mode === "shadow";

  // Copy keyword to clipboard
  const handleCopyKeyword = async (keyword: string) => {
    try {
      await navigator.clipboard.writeText(keyword);
      showSuccessToast(t("editor.review.keywordCopied"));
    } catch (error) {
      console.error("Failed to copy keyword:", error);
      showErrorToast("Failed to copy keyword");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="heading-feature text-base sm:text-lg text-gray-900 mb-2">
          {t("editor.review.title")}
        </h3>
        <p className="body-text text-gray-600 mb-4 text-sm sm:text-base">
          {t("editor.review.description")}
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* JD Analysis Summary */}
        {state.cvData?.jd_analysis && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              {t("editor.review.analyzedKeywords")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {state.cvData.jd_analysis.keywords.map(
                (keyword: string, index: number) => (
                  <KeywordTag key={index} keyword={keyword} />
                )
              )}
            </div>
          </div>
        )}

        {/* Scoring Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-medium text-gray-900">
                {isShadowMode
                  ? t("editor.review.profileStrength")
                  : t("editor.review.atsScore")}
              </h4>
              {isShadowMode && (
                <InfoTooltip
                  id="profile-strength-tooltip"
                  title={t("editor.review.profileStrength")}
                  content={t("editor.review.profileStrengthTooltip")}
                  placement="right"
                  icon="info"
                  dismissible={true}
                />
              )}
            </div>
            <AIAssistButton
              onClick={handleScoreCV}
              loading={isScoring}
              label={t("editor.review.scoreCV")}
              disabled={!state.cvData}
            />
          </div>

          {scoringResult ? (
            <div className="space-y-4">
              {/* Score Display */}
              <div className="text-center">
                <div
                  className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(
                    scoringResult.score
                  )}`}
                >
                  <span
                    className={`text-3xl font-bold ${getScoreColor(
                      scoringResult.score
                    )}`}
                  >
                    {scoringResult.score}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <p className="text-sm text-gray-600">
                    {t("editor.review.scoreOf100")}
                  </p>
                  <div className="flex items-center">
                    <InfoTooltip
                      id="ats-score-review"
                      title={
                        getTooltipContent("ats_score_meaning", locale).title
                      }
                      content={
                        getTooltipContent("ats_score_meaning", locale).content
                      }
                      placement="bottom"
                      icon="info"
                      dismissible={true}
                    />
                  </div>
                </div>
              </div>

              {/* Analysis Breakdown */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {/* Keyword Match - hide in Shadow Mode if 0% */}
                {(!isShadowMode ||
                  (isShadowMode &&
                    scoringResult.analysis?.keyword_match > 0)) && (
                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">
                      {Math.round(scoringResult.analysis?.keyword_match || 0)}%
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <div className="text-xs text-gray-600">
                        {t("editor.review.keywordMatch")}
                      </div>
                      <InfoTooltip
                        id="keyword-match-tooltip"
                        title={t("editor.review.keywordMatch")}
                        content={t("editor.review.tooltips.keywordMatch")}
                        placement="bottom"
                        icon="info"
                        dismissible={true}
                      />
                    </div>
                  </div>
                )}
                {/* Completeness - always show */}
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {Math.round(scoringResult.analysis?.completeness || 0)}%
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-xs text-gray-600">
                      {t("editor.review.completeness")}
                    </div>
                    <InfoTooltip
                      id="completeness-tooltip"
                      title={t("editor.review.completeness")}
                      content={t("editor.review.tooltips.completeness")}
                      placement="bottom"
                      icon="info"
                      dismissible={true}
                    />
                  </div>
                </div>
                {/* Formatting - always show */}
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                    {Math.round(scoringResult.analysis?.formatting || 0)}%
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-xs text-gray-600">
                      {t("editor.review.formatting")}
                    </div>
                    <InfoTooltip
                      id="formatting-tooltip"
                      title={t("editor.review.formatting")}
                      content={t("editor.review.tooltips.formatting")}
                      placement="bottom"
                      icon="info"
                      dismissible={true}
                    />
                  </div>
                </div>
                {/* Relevance - hide in Shadow Mode if 0% */}
                {(!isShadowMode ||
                  (isShadowMode && scoringResult.analysis?.relevance > 0)) && (
                  <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-orange-600">
                      {Math.round(scoringResult.analysis?.relevance || 0)}%
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <div className="text-xs text-gray-600">
                        {t("editor.review.relevance")}
                      </div>
                      <InfoTooltip
                        id="relevance-tooltip"
                        title={t("editor.review.relevance")}
                        content={t("editor.review.tooltips.relevance")}
                        placement="bottom"
                        icon="info"
                        dismissible={true}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Keywords Analysis */}
              {scoringResult.matchedKeywords &&
                scoringResult.matchedKeywords.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-green-700 mb-2">
                      ✓ {t("editor.review.matchedKeywords")} (
                      {scoringResult.matchedKeywords.length || 0}):
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {scoringResult.matchedKeywords.map(
                        (keyword: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {keyword}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {scoringResult.missingKeywords &&
                scoringResult.missingKeywords.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-red-700 mb-2">
                      ⚠️ {t("editor.review.missingKeywords")} (
                      {scoringResult.missingKeywords.length}):
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {scoringResult.missingKeywords.map(
                        (keyword: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => handleCopyKeyword(keyword)}
                            className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 cursor-pointer transition-colors"
                            title="Click to copy"
                          >
                            {keyword}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Suggestions - Hidden, shown in ATSOptimizationPanel instead */}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">📊</div>
              <p className="text-gray-600">
                {state.cvData?.jd_analysis
                  ? t("editor.review.scoring")
                  : t("editor.review.analyzeJDFirst")}
              </p>
            </div>
          )}
        </div>

        {/* ATS Optimization Panel - Show when there are suggestions */}
        {scoringResult && state.cvData && (
          <ATSOptimizationPanel
            cvData={state.cvData}
            reloadTrigger={suggestionsReloadTrigger}
          />
        )}

        {/* CV Length Validation */}
        {lengthWarning && (
          <ValidationMessage type="warning" message={lengthWarning} />
        )}
      </div>
    </div>
  );
}
