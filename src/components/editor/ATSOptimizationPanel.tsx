"use client";

import { useState, useEffect } from "react";
import { CVData } from "@/contexts/CVEditorContext";
import { useCVEditor } from "@/contexts/CVEditorContext";
import SuggestionItem from "./SuggestionItem";
import { handleAPIError } from "@/lib/error-handler";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import { apiGet, apiPost } from "@/lib/api-client";

interface ATSOptimizationPanelProps {
  cvData: CVData;
  reloadTrigger?: number | string; // Add reload trigger to force reload when suggestions are saved
}

interface DBSuggestion {
  id: string;
  suggestion_id: string;
  suggestion_text: string;
  suggestion_type: string;
  target_section: string;
  target_index: number | null;
  keyword: string | null;
  priority: "high" | "medium" | "low";
  is_active: boolean;
  is_applied: boolean;
  created_at: string;
  applied_at: string | null;
}

export default function ATSOptimizationPanel({
  cvData,
  reloadTrigger,
}: ATSOptimizationPanelProps) {
  const { updateCVData, saveCV } = useCVEditor();
  const [suggestions, setSuggestions] = useState<DBSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [isApplyingAll, setIsApplyingAll] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [cvData.id, reloadTrigger]);

  const loadSuggestions = async () => {
    if (!cvData?.id) return;

    setIsLoading(true);
    try {
      const data = await apiGet<{ suggestions: DBSuggestion[] }>(`/api/cv/suggestions/${cvData.id}`);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error loading suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = async (suggestionId: string) => {
    if (!cvData?.id) return;

    console.log("Applying suggestion:", { cvId: cvData.id, suggestionId });
    console.log("Available suggestions:", suggestions.map(s => ({ 
      suggestion_id: s.suggestion_id, 
      is_active: s.is_active, 
      is_applied: s.is_applied 
    })));

    setIsApplying(suggestionId);
    try {
      const result = await apiPost<{ updatedSection?: { section_type: string; data: unknown } }>(
        "/api/cv/apply-suggestion",
        { cvId: cvData.id, suggestionId },
        undefined,
        'vi'
      );

      // Update CV data in context
      if (result.updatedSection) {
        const updatedSections = {
          ...cvData.sections,
          [result.updatedSection.section_type]: (result.updatedSection.data as Record<string, unknown> | Record<string, unknown>[]),
        } as CVData['sections'];

        updateCVData({
          ...cvData,
          sections: updatedSections,
        });

        // Save to database
        await saveCV();
      }

      // Update only the applied suggestion in local state instead of reloading all
      setSuggestions(prevSuggestions => 
        prevSuggestions.map(s => 
          s.suggestion_id === suggestionId 
            ? { ...s, is_applied: true, applied_at: new Date().toISOString() }
            : s
        )
      );

      showSuccessToast("Gợi ý đã được áp dụng thành công!");
    } catch (error) {
      console.error("Error applying suggestion:", error);
      const appError = handleAPIError(error, "apply suggestion", "vi");
      showErrorToast(appError, "vi");
    } finally {
      setIsApplying(null);
    }
  };

  const handleApplyAll = async () => {
    if (!cvData?.id) return;

    const unappliedSuggestions = suggestions.filter((s) => !s.is_applied);
    if (unappliedSuggestions.length === 0) {
      showSuccessToast("Không có gợi ý nào để áp dụng");
      return;
    }

    setIsApplyingAll(true);
    try {
      const result = await apiPost<{ appliedCount: number; appliedSuggestionIds?: string[] }>(
        "/api/cv/apply-all-suggestions",
        { cvId: cvData.id },
        undefined,
        'vi'
      );

      // Update all applied suggestions in local state instead of reloading
      const appliedSuggestionIds = result.appliedSuggestionIds || 
        unappliedSuggestions.map(s => s.suggestion_id);
      
      setSuggestions(prevSuggestions => 
        prevSuggestions.map(s => 
          appliedSuggestionIds.includes(s.suggestion_id)
            ? { ...s, is_applied: true, applied_at: new Date().toISOString() }
            : s
        )
      );

      showSuccessToast(
        `Đã áp dụng thành công ${result.appliedCount} gợi ý!`
      );
    } catch (error) {
      console.error("Error applying all suggestions:", error);
      const appError = handleAPIError(error, "apply all suggestions", "vi");
      showErrorToast(appError, "vi");
    } finally {
      setIsApplyingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            Đang tải gợi ý...
          </div>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const activeUnappliedSuggestions = suggestions.filter(
    (s) => s.is_active && !s.is_applied
  );
  // const appliedSuggestions = suggestions.filter((s) => s.is_applied);

  return (
    <div
      className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6"
      role="region"
      aria-label="ATS Optimization Suggestions"
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">💡</span>
          <h4 className="text-base sm:text-lg font-semibold text-gray-900">
            ATS Optimization Suggestions
          </h4>
        </div>
        <p className="text-sm text-gray-600">
          Apply these suggestions to improve your ATS score:
        </p>
      </div>

      {activeUnappliedSuggestions.length > 0 && (
        <div className="mb-4">
          <button
            onClick={handleApplyAll}
            disabled={isApplyingAll}
            className="w-full px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplyingAll
              ? "Applying..."
              : `Apply All (${activeUnappliedSuggestions.length})`}
          </button>
        </div>
      )}

      <div className="space-y-3" role="list" aria-label="Optimization suggestions">
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion.id}
            suggestion={suggestion}
            onApply={handleApplySuggestion}
            isApplying={isApplying === suggestion.suggestion_id}
          />
        ))}
      </div>
    </div>
  );
}
