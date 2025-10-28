"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import AIAssistButton from "@/components/ui/AIAssistButton";
import InfoTooltip from "@/components/ui/InfoTooltip";
import ValidationMessage from "@/components/ui/ValidationMessage";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";
import { getTooltipContent } from "@/lib/tooltip-content";
import { validateDateRange } from "@/lib/validation";
import { apiPost } from "@/lib/api-client";

export default function ExperienceStep() {
  const { state, updateSection } = useCVEditor();
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
    
    // Validate date range if updating dates
    if (field === 'start_date' || field === 'end_date') {
      validateExperienceDates(index, updatedExperience[index]);
    }
  };

  const validateExperienceDates = (index: number, exp: Record<string, unknown>) => {
    const startDate = getStringValue(exp, 'start_date');
    const endDate = getStringValue(exp, 'end_date');
    const language = state.cvData?.language || 'vi';
    
    if (startDate && endDate) {
      const result = validateDateRange(startDate, endDate, language);
      if (result.errors.length > 0) {
        setDateErrors(prev => ({ ...prev, [index]: result.errors[0] }));
      } else {
        setDateErrors(prev => ({ ...prev, [index]: null }));
      }
    } else {
      setDateErrors(prev => ({ ...prev, [index]: null }));
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
    const achievements = getArrayValue(
      updatedExperience[expIndex],
      "achievements"
    );
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
        },
        undefined,
        'vi'
      );

      updateAchievement(expIndex, achIndex, result.improvedBullet);
      showSuccessToast("Đã cải thiện mô tả thành công!");
    } catch (error) {
      console.error("Error improving achievement:", error);
      const appError = handleAPIError(error, "improve bullet", "vi");
      showErrorToast(appError, "vi");
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
        },
        undefined,
        'vi'
      );

      updateExperience(expIndex, "achievements", result.achievements);
      showSuccessToast("Đã tạo mô tả kinh nghiệm thành công!");
    } catch (error) {
      console.error("Error writing experience with AI:", error);
      const appError = handleAPIError(error, "write experience", "vi");
      showErrorToast(appError, "vi");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Always use Vietnamese for tooltips
  const tooltipContent = getTooltipContent("ai_experience_benefits", "vi");

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-start gap-2 mb-2">
          <h3 className="heading-feature text-base sm:text-lg text-gray-900">
            Kinh nghiệm làm việc
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
          Liệt kê kinh nghiệm làm việc của bạn theo thứ tự thời gian gần nhất.
          Sử dụng các động từ hành động và số liệu cụ thể.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {experience.map((exp: Record<string, unknown>, expIndex: number) => (
          <div key={expIndex} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                Kinh nghiệm {expIndex + 1}
              </h4>
              <button
                onClick={() => removeExperience(expIndex)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Xóa
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên công ty *
                </label>
                <input
                  type="text"
                  value={getStringValue(exp, "company")}
                  onChange={(e) =>
                    updateExperience(expIndex, "company", e.target.value)
                  }
                  placeholder="Công ty ABC"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chức vụ *
                </label>
                <input
                  type="text"
                  value={getStringValue(exp, "job_title")}
                  onChange={(e) =>
                    updateExperience(expIndex, "job_title", e.target.value)
                  }
                  placeholder="Frontend Developer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày bắt đầu
                </label>
                <input
                  type="month"
                  value={getStringValue(exp, "start_date")}
                  onChange={(e) =>
                    updateExperience(expIndex, "start_date", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    dateErrors[expIndex] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày kết thúc
                </label>
                <input
                  type="month"
                  value={getStringValue(exp, "end_date")}
                  onChange={(e) =>
                    updateExperience(expIndex, "end_date", e.target.value)
                  }
                  placeholder="Hiện tại"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                    dateErrors[expIndex] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
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
                  Địa điểm
                </label>
                <input
                  type="text"
                  value={getStringValue(exp, "location")}
                  onChange={(e) =>
                    updateExperience(expIndex, "location", e.target.value)
                  }
                  placeholder="Hà Nội, Việt Nam"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa điểm
                </label>
                <input
                  type="text"
                  value={getStringValue(exp, "location")}
                  onChange={(e) =>
                    updateExperience(expIndex, "location", e.target.value)
                  }
                  placeholder="Hà Nội, Việt Nam"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Thành tích và trách nhiệm
                </label>
                <AIAssistButton
                  onClick={() => handleAIWriteExperience(expIndex)}
                  loading={loadingStates[`write-${expIndex}`] || false}
                  label="Để AI viết giúp bạn ✍️"
                  disabled={!getStringValue(exp, "job_title").trim()}
                />
              </div>
              {getArrayValue(exp, "achievements").map(
                (achievement: string, achIndex: number) => (
                  <div
                    key={achIndex}
                    className="flex items-start space-x-2 mb-2"
                  >
                    <input
                      type="text"
                      value={achievement}
                      onChange={(e) =>
                        updateAchievement(expIndex, achIndex, e.target.value)
                      }
                      placeholder="Ví dụ: Phát triển ứng dụng web tăng 30% hiệu suất..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    />
                    <AIAssistButton
                      onClick={() =>
                        handleImproveAchievement(expIndex, achIndex)
                      }
                      loading={
                        loadingStates[`improve-${expIndex}-${achIndex}`] ||
                        false
                      }
                      label="AI"
                      disabled={!achievement.trim()}
                    />
                    <button
                      onClick={() => removeAchievement(expIndex, achIndex)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      ×
                    </button>
                  </div>
                )
              )}
              <button
                onClick={() => addAchievement(expIndex)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Thêm thành tích
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addExperience}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
        >
          + Thêm kinh nghiệm làm việc
        </button>
      </div>
    </div>
  );
}

// Export validation function for use in navigation
export function validateExperienceStep(experience: Record<string, unknown>[], language: 'vi' | 'en' = 'vi'): boolean {
  for (const exp of experience) {
    const startDate = String(exp.start_date || '');
    const endDate = String(exp.end_date || '');
    
    if (startDate && endDate) {
      const result = validateDateRange(startDate, endDate, language);
      if (result.errors.length > 0) {
        return false;
      }
    }
  }
  
  return true;
}
