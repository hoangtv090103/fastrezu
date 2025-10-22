"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import AIAssistButton from "@/components/ui/AIAssistButton";
import KeywordTag from "@/components/ui/KeywordTag";

export default function JDAnalysisStep() {
  const { state, setJDAnalysis } = useCVEditor();
  const [jdText, setJdText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleAnalyzeJD = async () => {
    if (!jdText.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-jd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jdText }),
      });

      if (response.ok) {
        const { keywords: extractedKeywords, analysis } = await response.json();
        setKeywords(extractedKeywords);
        setJDAnalysis(extractedKeywords, analysis);
      } else {
        console.error('Failed to analyze JD');
      }
    } catch (error) {
      console.error('Error analyzing JD:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          Phân tích Mô tả Công việc (JD)
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

        {keywords.length > 0 && (
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
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ Đã phân tích JD thành công. Các từ khóa này sẽ được sử dụng để tối ưu hóa CV của bạn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
