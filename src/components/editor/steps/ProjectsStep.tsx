"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import AIAssistButton from "@/components/ui/AIAssistButton";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";

export default function ProjectsStep() {
  const { state, updateSection } = useCVEditor();
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  
  const projects = (state.cvData?.sections.projects || []) as Record<string, unknown>[];

  const addProject = () => {
    const newProject = {
      name: "",
      description: "",
      technologies: "",
      link: "",
      achievements: [""],
    };
    updateSection('projects', [...projects, newProject]);
  };

  const removeProject = (index: number) => {
        const updatedProjects = projects.filter((_: unknown, i: number) => i !== index);
    updateSection('projects', updatedProjects);
  };

  const updateProject = (index: number, field: string, value: string | string[]) => {
    const updatedProjects = [...projects];
    updatedProjects[index] = {
      ...updatedProjects[index],
      [field]: value,
    };
    updateSection('projects', updatedProjects);
  };

  const getStringValue = (project: Record<string, unknown>, key: string): string => {
    const value = project[key];
    return typeof value === 'string' ? value : '';
  };

  const getArrayValue = (project: Record<string, unknown>, key: string): string[] => {
    const value = project[key];
    return Array.isArray(value) ? value : [];
  };

  const addAchievement = (projIndex: number) => {
    const updatedProjects = [...projects];
    const achievements = getArrayValue(updatedProjects[projIndex], 'achievements');
    updatedProjects[projIndex] = {
      ...updatedProjects[projIndex],
      achievements: [...achievements, ""]
    };
    updateSection('projects', updatedProjects);
  };

  const removeAchievement = (projIndex: number, achIndex: number) => {
    const updatedProjects = [...projects];
    const achievements = getArrayValue(updatedProjects[projIndex], 'achievements');
    updatedProjects[projIndex] = {
      ...updatedProjects[projIndex],
      achievements: achievements.filter((_: unknown, i: number) => i !== achIndex)
    };
    updateSection('projects', updatedProjects);
  };

  const updateAchievement = (projIndex: number, achIndex: number, value: string) => {
    const updatedProjects = [...projects];
    const achievements = getArrayValue(updatedProjects[projIndex], 'achievements');
    achievements[achIndex] = value;
    updatedProjects[projIndex] = {
      ...updatedProjects[projIndex],
      achievements
    };
    updateSection('projects', updatedProjects);
  };

  const handleImproveAchievement = async (projIndex: number, achIndex: number) => {
    const achievements = getArrayValue(projects[projIndex], 'achievements');
    const achievement = achievements[achIndex];
    if (typeof achievement !== 'string' || !achievement.trim()) return;

    const loadingKey = `improve-${projIndex}-${achIndex}`;
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const response = await fetch('/api/ai/improve-bullet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bulletPoint: achievement,
          context: projects[projIndex],
          jdKeywords: state.cvData?.jd_analysis?.keywords,
          language: state.cvData?.language || 'vi'
        }),
      });

      if (response.ok) {
        const { improvedBullet } = await response.json();
        updateAchievement(projIndex, achIndex, improvedBullet);
        showSuccessToast('Đã cải thiện mô tả thành công!');
      } else {
        const appError = handleAPIError({ status: response.status }, 'improve bullet', 'vi');
        showErrorToast(appError, 'vi');
      }
    } catch (error) {
      console.error('Error improving achievement:', error);
      const appError = handleAPIError(error, 'improve bullet', 'vi');
      showErrorToast(appError, 'vi');
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          Dự án
        </h3>
        <p className="body-text text-gray-600 mb-4">
          Liệt kê các dự án quan trọng mà bạn đã tham gia. Bao gồm cả dự án cá nhân và dự án công việc.
        </p>
      </div>

      <div className="space-y-6">
        {projects.map((project: Record<string, unknown>, projIndex: number) => (
          <div key={projIndex} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                Dự án {projIndex + 1}
              </h4>
              <button
                onClick={() => removeProject(projIndex)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Xóa
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên dự án *
                </label>
                <input
                  type="text"
                  value={getStringValue(project, 'name')}
                  onChange={(e) => updateProject(projIndex, 'name', e.target.value)}
                  placeholder="Website bán hàng trực tuyến"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả dự án
                </label>
                <textarea
                  value={getStringValue(project, 'description')}
                  onChange={(e) => updateProject(projIndex, 'description', e.target.value)}
                  placeholder="Mô tả ngắn gọn về dự án, mục đích và phạm vi..."
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Công nghệ sử dụng
                  </label>
                  <input
                    type="text"
                    value={getStringValue(project, 'technologies')}
                    onChange={(e) => updateProject(projIndex, 'technologies', e.target.value)}
                    placeholder="React, Node.js, MongoDB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link dự án
                  </label>
                  <input
                    type="url"
                    value={getStringValue(project, 'link')}
                    onChange={(e) => updateProject(projIndex, 'link', e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thành tích và đóng góp
                </label>
                {getArrayValue(project, 'achievements').map((achievement: string, achIndex: number) => (
                  <div key={achIndex} className="flex items-start space-x-2 mb-2">
                    <input
                      type="text"
                      value={achievement}
                      onChange={(e) => updateAchievement(projIndex, achIndex, e.target.value)}
                      placeholder="Ví dụ: Tăng 40% tốc độ tải trang..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    />
                    <AIAssistButton
                      onClick={() => handleImproveAchievement(projIndex, achIndex)}
                      loading={loadingStates[`improve-${projIndex}-${achIndex}`] || false}
                      label="AI"
                      disabled={!achievement.trim()}
                    />
                    <button
                      onClick={() => removeAchievement(projIndex, achIndex)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addAchievement(projIndex)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Thêm thành tích
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addProject}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
        >
          + Thêm dự án
        </button>
      </div>
    </div>
  );
}
