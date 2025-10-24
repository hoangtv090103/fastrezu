"use client";

import { useCVEditor } from "@/contexts/CVEditorContext";
import CVTemplate from "@/components/cv/CVTemplate";
import ATSScoreWidget from "@/components/cv/ATSScoreWidget";
import ExportButtons from "@/components/cv/ExportButtons";

export default function CVPreview() {
  const { state } = useCVEditor();

  if (!state.cvData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">📄</span>
          </div>
          <p className="body-text text-gray-600">Chưa có dữ liệu CV</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with ATS Score */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="heading-feature text-lg text-gray-900">
            Preview
          </h2>
          <ATSScoreWidget score={state.cvData.ats_score} />
        </div>
      </div>

      {/* CV Preview */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <CVTemplate cvData={state.cvData} />
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="p-6 border-t border-gray-200 bg-white">
        <ExportButtons cvData={state.cvData} />
      </div>
    </div>
  );
}
