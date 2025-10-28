"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import AIAssistButton from "@/components/ui/AIAssistButton";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";

export default function SkillsStep() {
  const { state, updateSection } = useCVEditor();
  const [isExtracting, setIsExtracting] = useState(false);
  
  const skillsData = (state.cvData?.sections.skills || {}) as Record<string, unknown>;
  const skills = {
    technical: Array.isArray(skillsData.technical) ? skillsData.technical as string[] : [],
    soft: Array.isArray(skillsData.soft) ? skillsData.soft as string[] : []
  };

  const addTechnicalSkill = (skill: string) => {
    if (skill.trim() && !skills.technical.includes(skill.trim())) {
      updateSection('skills', {
        ...skillsData,
        technical: [...skills.technical, skill.trim()],
      });
    }
  };

  const removeTechnicalSkill = (index: number) => {
    const updatedSkills = [...skills.technical];
    updatedSkills.splice(index, 1);
    updateSection('skills', {
      ...skillsData,
      technical: updatedSkills,
    });
  };

  const addSoftSkill = (skill: string) => {
    if (skill.trim() && !skills.soft.includes(skill.trim())) {
      updateSection('skills', {
        ...skillsData,
        soft: [...skills.soft, skill.trim()],
      });
    }
  };

  const removeSoftSkill = (index: number) => {
    const updatedSkills = [...skills.soft];
    updatedSkills.splice(index, 1);
    updateSection('skills', {
      ...skillsData,
      soft: updatedSkills,
    });
  };

  const handleExtractSkillsFromJD = async () => {
    if (!state.cvData?.jd_analysis?.keywords) return;

    setIsExtracting(true);
    try {
      const response = await fetch('/api/ai/extract-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jdKeywords: state.cvData.jd_analysis.keywords,
          existingSkills: skills,
          language: state.cvData?.language || 'vi'
        }),
      });

      if (response.ok) {
        const { technicalSkills, softSkills } = await response.json();
        
        
        // Filter out skills that already exist
        const newTechnicalSkills = technicalSkills.filter((skill: string) => 
          skill.trim() && !skills.technical.includes(skill.trim())
        );
        
        const newSoftSkills = softSkills.filter((skill: string) => 
          skill.trim() && !skills.soft.includes(skill.trim())
        );
        
        
        // Update skills section with all new skills at once
        if (newTechnicalSkills.length > 0 || newSoftSkills.length > 0) {
          updateSection('skills', {
            ...skillsData,
            technical: [...skills.technical, ...newTechnicalSkills],
            soft: [...skills.soft, ...newSoftSkills],
          });
          showSuccessToast('Đã trích xuất kỹ năng từ JD thành công!');
        } else {
          showSuccessToast('Không tìm thấy kỹ năng mới để thêm.');
        }
      } else {
        const appError = handleAPIError({ status: response.status }, 'extract skills', 'vi');
        showErrorToast(appError, 'vi');
      }
    } catch (error) {
      console.error('Error extracting skills:', error);
      const appError = handleAPIError(error, 'extract skills', 'vi');
      showErrorToast(appError, 'vi');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          Kỹ năng
        </h3>
        <p className="body-text text-gray-600 mb-4">
          Liệt kê các Kỹ năng chuyên môn và kỹ năng mềm của bạn. Sử dụng từ khóa phù hợp với công việc bạn đang ứng tuyển.
        </p>
      </div>

      <div className="space-y-6">
        {/* Technical Skills */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Kỹ năng chuyên môn</h4>
            {state.cvData?.jd_analysis?.keywords && (
              <AIAssistButton
                onClick={handleExtractSkillsFromJD}
                loading={isExtracting}
                label="Trích xuất từ JD"
                disabled={false}
              />
            )}
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
                placeholder="Thêm Kỹ năng chuyên môn..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addTechnicalSkill(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addTechnicalSkill(input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>

        {/* Soft Skills */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Kỹ năng mềm</h4>

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
                placeholder="Thêm kỹ năng mềm..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addSoftSkill(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  addSoftSkill(input.value);
                  input.value = '';
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">Gợi ý kỹ năng phổ biến:</h5>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Chuyên môn: </span>
              <span className="text-sm text-blue-600">
                JavaScript, Python, React, Node.js, SQL, Git, Docker, AWS, Agile, Scrum
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Mềm: </span>
              <span className="text-sm text-green-600">
                Lãnh đạo, Giao tiếp, Làm việc nhóm, Giải quyết vấn đề, Quản lý thời gian
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
