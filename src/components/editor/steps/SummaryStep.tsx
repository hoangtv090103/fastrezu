"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import AIAssistButton from "@/components/ui/AIAssistButton";

export default function SummaryStep() {
  const { state, updateSection } = useCVEditor();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const summary = state.cvData?.sections.summary || {};

  const handleInputChange = (value: string) => {
    updateSection('summary', {
      ...summary,
      content: value,
    });
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalInfo: state.cvData?.sections.personal_info,
          experience: state.cvData?.sections.experience,
          jdKeywords: state.cvData?.jd_analysis?.keywords,
        }),
      });

      if (response.ok) {
        const { summary: generatedSummary } = await response.json();
        handleInputChange(generatedSummary);
      } else {
        console.error('Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const characterCount = summary.content?.length || 0;
  const isOptimalLength = characterCount >= 200 && characterCount <= 500;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          Tóm tắt nghề nghiệp
        </h3>
        <p className="body-text text-gray-600 mb-4">
          Viết 3-5 câu tóm tắt về kinh nghiệm và mục tiêu nghề nghiệp của bạn. Đây là phần quan trọng nhất để thu hút nhà tuyển dụng.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
              Tóm tắt nghề nghiệp
            </label>
            <div className="flex items-center space-x-2">
              <span className={`text-xs ${isOptimalLength ? 'text-green-600' : 'text-gray-500'}`}>
                {characterCount}/500 ký tự
              </span>
              {isOptimalLength && <span className="text-xs text-green-600">✓</span>}
            </div>
          </div>
          <textarea
            id="summary"
            value={summary.content || ""}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Ví dụ: Chuyên viên phát triển phần mềm với 3 năm kinh nghiệm trong việc xây dựng ứng dụng web và mobile. Có kinh nghiệm làm việc với React, Node.js, và các công nghệ cloud. Mong muốn đóng góp vào các dự án có tác động lớn và phát triển kỹ năng lãnh đạo kỹ thuật."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Khuyến nghị: 200-500 ký tự để tối ưu cho ATS
          </p>
        </div>

        <AIAssistButton
          onClick={handleGenerateWithAI}
          loading={isGenerating}
          label="Tạo tóm tắt với AI"
          disabled={!state.cvData?.sections.personal_info?.full_name}
        />

        {state.cvData?.jd_analysis?.keywords && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 AI sẽ sử dụng các từ khóa từ JD để tối ưu hóa tóm tắt của bạn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
