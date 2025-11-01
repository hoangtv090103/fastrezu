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

  const getPriorityColor = (priority: string) => {
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
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
            {suggestion.is_applied && (
              <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
                <span className="text-green-600">✓</span>
                Applied
              </span>
            )}
          </div>

          <p className="text-sm text-gray-700">{suggestion.suggestion_text}</p>
        </div>

        {!suggestion.is_applied && (
          <button
            onClick={handleApply}
            disabled={isDisabled}
            className="shrink-0 px-4 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Apply suggestion: ${suggestion.suggestion_text}`}
          >
            {isLocalApplying ? "Applying..." : "Apply"}
          </button>
        )}

        {suggestion.is_applied && (
          <div className="shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
        )}
      </div>
    </div>
  );
}