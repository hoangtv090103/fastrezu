"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";
import InfoTooltip from "@/components/ui/InfoTooltip";
import ValidationMessage from "@/components/ui/ValidationMessage";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";
import { getTooltipContent } from "@/lib/tooltip-content";
import { validateDateRange } from "@/lib/validation";
import { useDebounce } from "@/lib/debounce";
import { apiPost } from "@/lib/api-client";

export default function ExperienceStep() {
  const { state, updateSection } = useCVEditor();
  const { t, locale } = useTranslation();
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [dateErrors, setDateErrors] = useState<{
    [key: number]: string | null;
  }>({});

  const experience = (state.cvData?.sections.experience || []) as Record<
    string,
    unknown
  >[];

  // Debounced validation (300ms delay)
  const debouncedValidateDates = useDebounce(
    (index: number, exp: Record<string, unknown>) => {
      validateExperienceDates(index, exp);
    },
    300
  );

  const addExperience = () => {
    const newExperience = {
      company: "",
      job_title: "",
      start_date: "",
      end_date: "",
      location: "",
      achievements: [""],
    };
    updateSection("experience", [...experience, newExperience]);
  };

  const removeExperience = (index: number) => {
    const updatedExperience = experience.filter(
      (_: unknown, i: number) => i !== index
    );
    updateSection("experience", updatedExperience);
  };

  const updateExperience = (
    index: number,
    field: string,
    value: string | string[]
  ) => {
    const updatedExperience = [...experience];
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value,
    };
    updateSection("experience", updatedExperience);

    // Debounced validation for date range
    if (field === "start_date" || field === "end_date") {
      debouncedValidateDates(index, updatedExperience[index]);
    }
  };

  const validateExperienceDates = (
    index: number,
    exp: Record<string, unknown>
  ) => {
    const startDate = getStringValue(exp, "start_date");
    const endDate = getStringValue(exp, "end_date");
    const language = state.cvData?.language || "vi";

    if (startDate && endDate) {
      const result = validateDateRange(startDate, endDate, language);
      if (result.errors.length > 0) {
        setDateErrors((prev) => ({ ...prev, [index]: result.errors[0] }));
      } else {
        setDateErrors((prev) => ({ ...prev, [index]: null }));
      }
    } else {
      setDateErrors((prev) => ({ ...prev, [index]: null }));
    }
  };

  const getStringValue = (
    exp: Record<string, unknown>,
    key: string
  ): string => {
    const value = exp[key];
    return typeof value === "string" ? value : "";
  };

  const getArrayValue = (
    exp: Record<string, unknown>,
    key: string
  ): string[] => {
    const value = exp[key];
    return Array.isArray(value) ? value : [];
  };

  const addAchievement = (expIndex: number) => {
    const updatedExperience = [...experience];
    const achievements = getArrayValue(
      updatedExperience[expIndex],
      "achievements"
    );
    updatedExperience[expIndex] = {
      ...updatedExperience[expIndex],
      achievements: [...achievements, ""],
    };
    updateSection("experience", updatedExperience);
  };

  const removeAchievement = (expIndex: number, achIndex: number) => {
    const updatedExperience = [...experience];
    const achievements = getArrayValue(
      updatedExperience[expIndex],
      "achievements"
    );
    updatedExperience[expIndex] = {
      ...updatedExperience[expIndex],
      achievements: achievements.filter(
        (_: unknown, i: number) => i !== achIndex
      ),
    };
    updateSection("experience", updatedExperience);
  };

  const updateAchievement = (
    expIndex: number,
    achIndex: number,
    value: string
  ) => {
    const updatedExperience = [...experience];
    const achievements = [
      ...getArrayValue(updatedExperience[expIndex], "achievements"),
    ];
    achievements[achIndex] = value;
    updatedExperience[expIndex] = {
      ...updatedExperience[expIndex],
      achievements,
    };
    updateSection("experience", updatedExperience);
  };

  const handleImproveAchievement = async (
    expIndex: number,
    achIndex: number
  ) => {
    const achievements = getArrayValue(experience[expIndex], "achievements");
    const achievement = achievements[achIndex];
    if (typeof achievement !== "string" || !achievement.trim()) return;

    const loadingKey = `improve-${expIndex}-${achIndex}`;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      const result = await apiPost<{ improvedBullet: string }>(
        "/api/ai/improve-bullet",
        {
          bulletPoint: achievement,
          context: experience[expIndex],
          jdKeywords: state.cvData?.jd_analysis?.keywords,
          language: state.cvData?.language || "vi",
          mode: state.cvData?.jd_analysis?.mode || "real",
        },
        undefined,
        state.cvData?.language || "vi"
      );

      updateAchievement(expIndex, achIndex, result.improvedBullet);
      showSuccessToast("Đã cải thiện mô tả thành công!");
    } catch (error) {
      console.error("Error improving achievement:", error);
      const appError = handleAPIError(error, "improve bullet", locale);
      showErrorToast(appError, locale);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleAIWriteExperience = async (expIndex: number) => {
    const exp = experience[expIndex];
    const jobTitle = getStringValue(exp, "job_title");
    const company = getStringValue(exp, "company");

    if (!jobTitle.trim()) {
      showErrorToast("Vui lòng nhập chức vụ trước khi sử dụng AI", "vi");
      return;
    }

    const loadingKey = `write-${expIndex}`;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      const result = await apiPost<{ achievements: string[] }>(
        "/api/ai/write-experience",
        {
          jobTitle,
          company,
          jdKeywords: state.cvData?.jd_analysis?.keywords || [],
          experienceLevel: "Mid-level", // Could be determined from other data
          language: state.cvData?.language || "vi",
          mode: state.cvData?.jd_analysis?.mode || "real",
          currentDescription: exp.description || "", // Pass existing description for improvement
        },
        undefined,
        state.cvData?.language
      );

      updateExperience(expIndex, "achievements", result.achievements);
      showSuccessToast("Đã tạo mô tả kinh nghiệm thành công!");
    } catch (error) {
      console.error("Error writing experience with AI:", error);
      const appError = handleAPIError(error, "write experience", "vi");
      showErrorToast(appError, locale);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Always use Vietnamese for tooltips
  const tooltipContent = getTooltipContent("ai_experience_benefits", locale);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-start gap-2 mb-2">
          <h3 className="heading-feature text-base sm:text-lg text-gray-900">
            {t("editor.experience.title")}
          </h3>
          <div className="mt-0.5">
            <InfoTooltip
              id="ai-experience-benefits"
              title={tooltipContent.title}
              content={tooltipContent.content}
              placement="bottom"
              icon="info"
            />
          </div>
        </div>
        <p className="body-text text-gray-600 mb-4 text-sm sm:text-base">
          {t("editor.experience.description")}
        </p>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {experience.map((exp: Record<string, unknown>, expIndex: number) => (
          <div
            key={expIndex}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 text-lg">
                {t("editor.experience.title")} {expIndex + 1}
              </h4>
              <button
                onClick={() => removeExperience(expIndex)}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
              >
                {t("editor.experience.remove")}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.experience.company")} *
                </label>
                <input
                  type="text"
                  value={getStringValue(exp, "company")}
                  onChange={(e) =>
                    updateExperience(expIndex, "company", e.target.value)
                  }
                  placeholder={t("editor.experience.companyPlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.experience.jobTitle")} *
                </label>
                <input
                  type="text"
                  value={getStringValue(exp, "job_title")}
                  onChange={(e) =>
                    updateExperience(expIndex, "job_title", e.target.value)
                  }
                  placeholder={t("editor.experience.jobTitlePlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.experience.startDate")}
                </label>
                <input
                  type="month"
                  value={getStringValue(exp, "start_date")}
                  onChange={(e) =>
                    updateExperience(expIndex, "start_date", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    dateErrors[expIndex]
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.experience.endDate")}
                </label>
                <input
                  type="month"
                  value={getStringValue(exp, "end_date")}
                  onChange={(e) =>
                    updateExperience(expIndex, "end_date", e.target.value)
                  }
                  placeholder={t("editor.experience.currentlyWorking")}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    dateErrors[expIndex]
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
              </div>
            </div>

            {dateErrors[expIndex] && (
              <div className="mb-4">
                <ValidationMessage
                  type="error"
                  message={dateErrors[expIndex]!}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.experience.location")}
                </label>
                <input
                  type="text"
                  value={getStringValue(exp, "location")}
                  onChange={(e) =>
                    updateExperience(expIndex, "location", e.target.value)
                  }
                  placeholder={t("editor.experience.locationPlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t("editor.experience.achievements")}
                </label>
                <button
                  onClick={() => handleAIWriteExperience(expIndex)}
                  disabled={
                    !getStringValue(exp, "job_title").trim() ||
                    loadingStates[`write-${expIndex}`]
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-sm hover:shadow-md whitespace-nowrap self-start sm:self-auto"
                  title={t("editor.experience.improve")}
                >
                  {loadingStates[`write-${expIndex}`] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t("editor.experience.improving")}</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                      <span>{t("editor.experience.improve")}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="space-y-3">
                {getArrayValue(exp, "achievements").map(
                  (achievement: string, achIndex: number) => (
                    <div
                      key={achIndex}
                      className="flex flex-col sm:flex-row items-stretch gap-2"
                    >
                      <textarea
                        value={achievement}
                        onChange={(e) =>
                          updateAchievement(expIndex, achIndex, e.target.value)
                        }
                        placeholder={t(
                          "editor.experience.achievementPlaceholder"
                        )}
                        rows={2}
                        className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none"
                      />
                      <div className="flex items-start gap-2 sm:flex-col sm:justify-start">
                        <button
                          onClick={() =>
                            handleImproveAchievement(expIndex, achIndex)
                          }
                          disabled={
                            !achievement.trim() ||
                            loadingStates[`improve-${expIndex}-${achIndex}`]
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-xs font-medium rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-sm hover:shadow-md whitespace-nowrap"
                          title="Cải thiện với AI"
                        >
                          {loadingStates[`improve-${expIndex}-${achIndex}`] ? (
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                                />
                              </svg>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => removeAchievement(expIndex, achIndex)}
                          className="inline-flex items-center justify-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Xóa"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
              <button
                onClick={() => addAchievement(expIndex)}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1 hover:gap-2 transition-all duration-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>{t("editor.experience.addAchievement")}</span>
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addExperience}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
        >
          + {t("editor.experience.addExperience")}
        </button>
      </div>
    </div>
  );
}

// Export validation function for use in navigation
export function validateExperienceStep(
  experience: Record<string, unknown>[],
  language: "vi" | "en" = "vi"
): boolean {
  const locale = language === "en" ? "en" : "vi";
  for (const exp of experience) {
    const startDate = String(exp.start_date || "");
    const endDate = String(exp.end_date || "");

    if (startDate && endDate) {
      const result = validateDateRange(startDate, endDate, locale);
      if (result.errors.length > 0) {
        return false;
      }
    }
  }

  return true;
}
