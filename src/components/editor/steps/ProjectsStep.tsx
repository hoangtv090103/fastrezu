"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";
import { apiPost } from "@/lib/api-client";

export default function ProjectsStep() {
  const { state, updateSection } = useCVEditor();
  const { t } = useTranslation();
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  const projects = (state.cvData?.sections.projects || []) as Record<
    string,
    unknown
  >[];

  const addProject = () => {
    const newProject = {
      name: "",
      description: "",
      technologies: "",
      link: "",
      achievements: [""],
    };
    updateSection("projects", [...projects, newProject]);
  };

  const removeProject = (index: number) => {
    const updatedProjects = projects.filter(
      (_: unknown, i: number) => i !== index
    );
    updateSection("projects", updatedProjects);
  };

  const updateProject = (
    index: number,
    field: string,
    value: string | string[]
  ) => {
    const updatedProjects = [...projects];
    updatedProjects[index] = {
      ...updatedProjects[index],
      [field]: value,
    };
    updateSection("projects", updatedProjects);
  };

  const getStringValue = (
    project: Record<string, unknown>,
    key: string
  ): string => {
    const value = project[key];
    return typeof value === "string" ? value : "";
  };

  const getArrayValue = (
    project: Record<string, unknown>,
    key: string
  ): string[] => {
    const value = project[key];
    return Array.isArray(value) ? value : [];
  };

  const addAchievement = (projIndex: number) => {
    const updatedProjects = [...projects];
    const achievements = getArrayValue(
      updatedProjects[projIndex],
      "achievements"
    );
    updatedProjects[projIndex] = {
      ...updatedProjects[projIndex],
      achievements: [...achievements, ""],
    };
    updateSection("projects", updatedProjects);
  };

  const removeAchievement = (projIndex: number, achIndex: number) => {
    const updatedProjects = [...projects];
    const achievements = getArrayValue(
      updatedProjects[projIndex],
      "achievements"
    );
    updatedProjects[projIndex] = {
      ...updatedProjects[projIndex],
      achievements: achievements.filter(
        (_: unknown, i: number) => i !== achIndex
      ),
    };
    updateSection("projects", updatedProjects);
  };

  const updateAchievement = (
    projIndex: number,
    achIndex: number,
    value: string
  ) => {
    const updatedProjects = [...projects];
    const achievements = getArrayValue(
      updatedProjects[projIndex],
      "achievements"
    );
    achievements[achIndex] = value;
    updatedProjects[projIndex] = {
      ...updatedProjects[projIndex],
      achievements,
    };
    updateSection("projects", updatedProjects);
  };

  const handleImproveAchievement = async (
    projIndex: number,
    achIndex: number
  ) => {
    const achievements = getArrayValue(projects[projIndex], "achievements");
    const achievement = achievements[achIndex];
    if (typeof achievement !== "string" || !achievement.trim()) return;

    const loadingKey = `improve-${projIndex}-${achIndex}`;
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      const result = await apiPost<{ result: string }>(
        "/api/ai/rewrite-text",
        {
          text: achievement,
          language: state.cvData?.language || "vi",
        },
        undefined,
        state.cvData?.language || "vi"
      );
      updateAchievement(projIndex, achIndex, result.result);
      showSuccessToast(t("editor.projects.improveSuccess"));
    } catch (error) {
      console.error("Error improving achievement:", error);
      const appError = handleAPIError(error, "rewrite text", "vi");
      showErrorToast(appError, "vi");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          {t("editor.projects.title")}
        </h3>
        <p className="body-text text-gray-600 mb-4">
          {t("editor.projects.description")}
        </p>
      </div>

      <div className="space-y-6">
        {projects.map((project: Record<string, unknown>, projIndex: number) => (
          <div
            key={projIndex}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                {t("editor.projects.title")} {projIndex + 1}
              </h4>
              <button
                onClick={() => removeProject(projIndex)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                {t("editor.projects.remove")}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.projects.name")} *
                </label>
                <input
                  type="text"
                  value={getStringValue(project, "name")}
                  onChange={(e) =>
                    updateProject(projIndex, "name", e.target.value)
                  }
                  placeholder={t("editor.projects.namePlaceholder")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("editor.projects.projectDescription")}
                </label>
                <textarea
                  value={getStringValue(project, "description")}
                  onChange={(e) =>
                    updateProject(projIndex, "description", e.target.value)
                  }
                  placeholder={t("editor.projects.descriptionPlaceholder")}
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("editor.projects.technologies")}
                  </label>
                  <input
                    type="text"
                    value={getStringValue(project, "technologies")}
                    onChange={(e) =>
                      updateProject(projIndex, "technologies", e.target.value)
                    }
                    placeholder={t("editor.projects.technologiesPlaceholder")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("editor.projects.url")}
                  </label>
                  <input
                    type="url"
                    value={getStringValue(project, "link")}
                    onChange={(e) =>
                      updateProject(projIndex, "link", e.target.value)
                    }
                    placeholder={t("editor.projects.urlPlaceholder")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("editor.education.achievements")}
                </label>
                <div className="space-y-3">
                  {getArrayValue(project, "achievements").map(
                    (achievement: string, achIndex: number) => (
                      <div
                        key={achIndex}
                        className="flex flex-col sm:flex-row items-stretch gap-2"
                      >
                        <div className="relative flex-1">
                          <textarea
                            value={achievement}
                            onChange={(e) =>
                              updateAchievement(
                                projIndex,
                                achIndex,
                                e.target.value
                              )
                            }
                            placeholder={t(
                              "editor.experience.achievementPlaceholder"
                            )}
                            rows={2}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none"
                          />
                          <button
                            onClick={() =>
                              handleImproveAchievement(projIndex, achIndex)
                            }
                            disabled={
                              !achievement.trim() ||
                              loadingStates[`improve-${projIndex}-${achIndex}`]
                            }
                            className="absolute right-2 bottom-2 p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t("editor.experience.improve")}
                          >
                            {loadingStates[
                              `improve-${projIndex}-${achIndex}`
                            ] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            ) : (
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
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col sm:justify-center">
                          <button
                            onClick={() =>
                              removeAchievement(projIndex, achIndex)
                            }
                            className="inline-flex items-center justify-center px-3 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200"
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
                  onClick={() => addAchievement(projIndex)}
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
          </div>
        ))}

        <button
          onClick={addProject}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
        >
          + {t("editor.projects.addProject")}
        </button>
      </div>
    </div>
  );
}
