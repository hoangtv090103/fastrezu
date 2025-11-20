"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";
import AIAssistButton from "@/components/ui/AIAssistButton";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";
import { apiPost } from "@/lib/api-client";

export default function SkillsStep() {
  const { state, updateSection } = useCVEditor();
  const { t } = useTranslation();
  const [isExtracting, setIsExtracting] = useState(false);

  const skillsData = (state.cvData?.sections.skills || {}) as Record<
    string,
    unknown
  >;
  const skills = {
    technical: Array.isArray(skillsData.technical)
      ? (skillsData.technical as string[])
      : [],
    soft: Array.isArray(skillsData.soft) ? (skillsData.soft as string[]) : [],
  };

  const addTechnicalSkill = (skill: string) => {
    if (skill.trim() && !skills.technical.includes(skill.trim())) {
      updateSection("skills", {
        ...skillsData,
        technical: [...skills.technical, skill.trim()],
      });
    }
  };

  const removeTechnicalSkill = (index: number) => {
    const updatedSkills = [...skills.technical];
    updatedSkills.splice(index, 1);
    updateSection("skills", {
      ...skillsData,
      technical: updatedSkills,
    });
  };

  const addSoftSkill = (skill: string) => {
    if (skill.trim() && !skills.soft.includes(skill.trim())) {
      updateSection("skills", {
        ...skillsData,
        soft: [...skills.soft, skill.trim()],
      });
    }
  };

  const removeSoftSkill = (index: number) => {
    const updatedSkills = [...skills.soft];
    updatedSkills.splice(index, 1);
    updateSection("skills", {
      ...skillsData,
      soft: updatedSkills,
    });
  };

  const handleExtractSkillsFromJD = async () => {
    if (!state.cvData?.jd_analysis?.keywords) return;

    setIsExtracting(true);
    try {
      const { technicalSkills, softSkills } = await apiPost<{
        technicalSkills: string[];
        softSkills: string[];
      }>(
        "/api/ai/extract-skills",
        {
          jdKeywords: state.cvData.jd_analysis.keywords,
          existingSkills: skills,
          language: state.cvData?.language || "vi",
        },
        undefined,
        "vi"
      );

      // Filter out skills that already exist
      const newTechnicalSkills = technicalSkills.filter(
        (skill: string) =>
          skill.trim() && !skills.technical.includes(skill.trim())
      );

      const newSoftSkills = softSkills.filter(
        (skill: string) => skill.trim() && !skills.soft.includes(skill.trim())
      );

      // Update skills section with all new skills at once
      if (newTechnicalSkills.length > 0 || newSoftSkills.length > 0) {
        updateSection("skills", {
          ...skillsData,
          technical: [...skills.technical, ...newTechnicalSkills],
          soft: [...skills.soft, ...newSoftSkills],
        });
        showSuccessToast("Đã trích xuất kỹ năng từ JD thành công!");
      } else {
        showSuccessToast("Không tìm thấy kỹ năng mới để thêm.");
      }
    } catch (error) {
      console.error("Error extracting skills:", error);
      const appError = handleAPIError(error, "extract skills", "vi");
      showErrorToast(appError, "vi");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          {t("editor.skills.title")}
        </h3>
        <p className="body-text text-gray-600 mb-4">
          {t("editor.skills.description")}
        </p>
      </div>

      {state.cvData?.jd_analysis?.keywords && (
        <div className="mb-6">
          <AIAssistButton
            onClick={handleExtractSkillsFromJD}
            loading={isExtracting}
            label={t("editor.skills.applyAll")}
            disabled={false}
            className="w-full justify-center"
          />
        </div>
      )}

      <div className="space-y-6">
        {/* Technical Skills */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              {t("editor.skills.skillName")}
            </h4>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {skills.technical?.map((skill: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeTechnicalSkill(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder={t("editor.skills.technicalSkillPlaceholder")}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addTechnicalSkill(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget
                    .previousElementSibling as HTMLInputElement;
                  addTechnicalSkill(input.value);
                  input.value = "";
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {t("editor.skills.addSkill")}
              </button>
            </div>
          </div>
        </div>

        {/* Soft Skills */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">
            {t("editor.skills.proficiency")}
          </h4>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {skills.soft?.map((skill: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => removeSoftSkill(index)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder={t("editor.skills.softSkillPlaceholder")}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addSoftSkill(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget
                    .previousElementSibling as HTMLInputElement;
                  addSoftSkill(input.value);
                  input.value = "";
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                {t("editor.skills.addSkill")}
              </button>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">
            {t("editor.skills.suggestions")}:
          </h5>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">
                {t("editor.skills.skillName")}:{" "}
              </span>
              <span className="text-sm text-blue-600">
                JavaScript, Python, React, Node.js, SQL, Git, Docker, AWS,
                Agile, Scrum
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">
                {t("editor.skills.proficiency")}:{" "}
              </span>
              <span className="text-sm text-green-600">
                {t("editor.skills.softSkillsExamples")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
