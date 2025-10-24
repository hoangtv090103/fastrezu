"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import AIAssistButton from "@/components/ui/AIAssistButton";
import KeywordTag from "@/components/ui/KeywordTag";

export default function JDAnalysisStep() {
  const { state, setJDAnalysis, setCurrentStep } = useCVEditor();
  const [jdText, setJdText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

const handleAnalyzeJD = async () => {
    if (!jdText.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/analyze-jd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jdText }),
      });

      if (response.ok) {
        const analysis = await response.json();
        // Extract keywords from the analysis response
        const extractedKeywords = analysis.ats_keywords || [];
        
        if (!Array.isArray(extractedKeywords)) {
          throw new Error('Invalid response format from AI service');
        }
        
        setKeywords(extractedKeywords);
        setJDAnalysis(extractedKeywords, analysis);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Có lỗi xảy ra khi phân tích JD');
      }
    } catch (error) {
      console.error('Error analyzing JD:', error);
      setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          Phân tích Mô tả công việc (JD)
        </h3>
        <p className="body-text text-gray-600 mb-4">
          Dán mô tả công việc bạn muốn ứng tuyển để AI phân tích và trích xuất từ khóa quan trọng.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="jd-text" className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả công việc
          </label>
          <textarea
            id="jd-text"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Dán mô tả công việc vào đây..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>

        <AIAssistButton
          onClick={handleAnalyzeJD}
          loading={isAnalyzing}
          label="Phân tích JD"
          disabled={!jdText.trim()}
        />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="shrink-0">
                <span className="text-red-600 text-lg">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">Lỗi phân tích JD</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {keywords && keywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Từ khóa được trích xuất:
            </h4>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <KeywordTag key={index} keyword={keyword} />
              ))}
            </div>
          </div>
        )}

        {state.cvData?.jd_analysis && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <div className="shrink-0">
                <span className="text-green-600 text-lg">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">
                  Đã phân tích JD thành công!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Các từ khóa này sẽ được sử dụng để tối ưu hóa CV của bạn. Bạn có thể tiếp tục với bước tiếp theo.
                </p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Tiếp theo: Thông tin cá nhân →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
