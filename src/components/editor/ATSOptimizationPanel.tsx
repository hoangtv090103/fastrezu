"use client";

import { useState, useEffect } from "react";
import { CVData } from "@/contexts/CVEditorContext";
import {
  generateSuggestions,
  getSectionStepIndex,
  Suggestion,
  SuggestionPriority,
} from "@/lib/suggestion-generator";

interface ATSOptimizationPanelProps {
  missingKeywords: string[];
  cvData: CVData;
  onNavigateToSection: (stepIndex: number) => void;
}

export default function ATSOptimizationPanel({
  missingKeywords,
  cvData,
  onNavigateToSection,
}: ATSOptimizationPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!missingKeywords || missingKeywords.length === 0) {
      setSuggestions([]);
      return;
    }

    // Generate initial suggestions
    const jdAnalysis = cvData.jd_analysis || { keywords: [], analysis: {} };
    const initialSuggestions = generateSuggestions(
      missingKeywords,
      cvData,
      jdAnalysis
    );

    setSuggestions(initialSuggestions);

    // Fetch AI-powered example sentences
    fetchExampleSentences(initialSuggestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKeywords, cvData]);

  const fetchExampleSentences = async (baseSuggestions: Suggestion[]) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/suggest-improvements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          suggestions: baseSuggestions,
          cvData: {
            sections: cvData.sections,
            language: cvData.language,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error("Error fetching example sentences:", error);
      // Keep the base suggestions without examples
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const stepIndex = getSectionStepIndex(suggestion.targetSection);
    onNavigateToSection(stepIndex);
  };

  const toggleExpanded = (suggestionId: string) => {
    setExpandedSuggestion((prev) =>
      prev === suggestionId ? null : suggestionId
    );
  };

  const getPriorityColor = (priority: SuggestionPriority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getPriorityLabel = (priority: SuggestionPriority) => {
    // Always use Vietnamese labels
    const labels = {
      high: "Cao",
      medium: "Trung bình",
      low: "Thấp",
    };

    return labels[priority];
  };

  const getHeaderText = () => {
    // Always use Vietnamese
    return "💡 Gợi ý tối ưu ATS";
  };

  const getDescriptionText = () => {
    // Always use Vietnamese
    return "Thêm các từ khóa sau để cải thiện điểm ATS của bạn:";
  };

  const getLoadingText = () => {
    // Always use Vietnamese
    return "Đang tạo ví dụ...";
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-linear-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 sm:p-6">
      <div className="mb-4">
        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          {getHeaderText()}
        </h4>
        <p className="text-sm text-gray-600">{getDescriptionText()}</p>
      </div>

      {isLoading && (
        <div className="text-center py-2 mb-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            {getLoadingText()}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                      suggestion.priority
                    )}`}
                  >
                    {getPriorityLabel(suggestion.priority)}
                  </span>
                  {suggestion.estimatedImpact > 0 && (
                    <span className="text-xs text-green-600 font-medium">
                      +{suggestion.estimatedImpact} điểm
                    </span>
                  )}
                </div>

                <h5 className="text-sm font-medium text-gray-900 mb-1">
                  {suggestion.title}
                </h5>

                <p className="text-xs text-gray-600 mb-2">
                  {suggestion.description}
                </p>

                {suggestion.exampleText && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleExpanded(suggestion.id)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      {expandedSuggestion === suggestion.id ? "▼" : "▶"}
                      Xem ví dụ
                    </button>

                    {expandedSuggestion === suggestion.id && (
                      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 italic">
                        &ldquo;{suggestion.exampleText}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSuggestionClick(suggestion)}
                className="shrink-0 px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200 whitespace-nowrap"
              >
                {suggestion.actionLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-purple-200">
        <p className="text-xs text-gray-500 text-center">
          Thêm các từ khóa này sẽ giúp CV của bạn vượt qua hệ thống ATS dễ dàng
          hơn.
        </p>
      </div>
    </div>
  );
}
