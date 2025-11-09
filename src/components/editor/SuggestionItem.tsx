"use client";

import { useState } from "react";

interface SuggestionItemProps {
  suggestion: {
    id: string;
    suggestion_id: string;
    suggestion_text: string;
    priority: "high" | "medium" | "low";
    is_applied: boolean;
  };
  onApply: (suggestionId: string) => Promise<void>;
  isApplying?: boolean;
}

export default function SuggestionItem({
  suggestion,
  onApply,
  isApplying = false,
}: SuggestionItemProps) {
  const [isLocalApplying, setIsLocalApplying] = useState(false);

  const handleApply = async () => {
    if (isLocalApplying || isApplying || suggestion.is_applied) return;

    setIsLocalApplying(true);
    try {
      await onApply(suggestion.suggestion_id);
    } catch (error) {
      console.error("Error applying suggestion:", error);
    } finally {
      setIsLocalApplying(false);
    }
  };

  const getPriorityColor = (priority: string, isApplied: boolean = false) => {
    if (isApplied) {
      // Grayscale theme for applied suggestions
      return "bg-gray-100 text-gray-600 border-gray-300";
    }

    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      high: "High",
      medium: "Medium",
      low: "Low",
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const isDisabled = isLocalApplying || isApplying || suggestion.is_applied;

  return (
    <div
      className={`border rounded-lg p-4 transition-all duration-200 ${
        suggestion.is_applied
          ? "bg-gray-50 border-gray-200 hover:shadow-sm"
          : "bg-white border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                suggestion.priority,
                suggestion.is_applied
              )}`}
            >
              {getPriorityLabel(suggestion.priority)}
            </span>
          </div>

          <p
            className={`text-sm ${
              suggestion.is_applied ? "text-gray-500" : "text-gray-700"
            }`}
          >
            {suggestion.suggestion_text}
          </p>
        </div>

        {!suggestion.is_applied && (
          <button
            onClick={handleApply}
            disabled={isDisabled}
            className="shrink-0 px-4 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Apply suggestion: ${suggestion.suggestion_text}`}
          >
            {isLocalApplying ? "Đang áp dụng..." : "Áp dụng"}
          </button>
        )}

        {suggestion.is_applied && (
              <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
                <span className="text-green-600">✓</span>
                Đã cập nhật
              </span>
            )}
      </div>
    </div>
  );
}