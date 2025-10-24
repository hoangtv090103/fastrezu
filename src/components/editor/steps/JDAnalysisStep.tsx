"use client";

import { useState, useEffect } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import AIAssistButton from "@/components/ui/AIAssistButton";
import KeywordTag from "@/components/ui/KeywordTag";

interface SavedJD {
  id: string;
  jdText: string;
  keywords: string[];
  analysis: Record<string, unknown>;
  createdAt: string;
  preview: string;
}

export default function JDAnalysisStep() {
  const { state, setJDAnalysis, setCurrentStep } = useCVEditor();
  const [jdText, setJdText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedJDs, setSavedJDs] = useState<SavedJD[]>([]);
  const [isLoadingJDs, setIsLoadingJDs] = useState(false);

  // Load saved JDs when component mounts
  useEffect(() => {
    if (state.cvData?.id) {
      loadSavedJDs();
    }
  }, [state.cvData?.id]);

  const loadSavedJDs = async () => {
    if (!state.cvData?.id) return;
    
    setIsLoadingJDs(true);
    try {
      const response = await fetch(`/api/jd/list?cvId=${state.cvData.id}`);
      if (response.ok) {
        const { jdAnalyses } = await response.json();
        setSavedJDs(jdAnalyses);
      }
    } catch (error) {
      console.error('Error loading saved JDs:', error);
    } finally {
      setIsLoadingJDs(false);
    }
  };

  const handleDeleteJD = async (jdId: string) => {
    try {
      const response = await fetch('/api/jd/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jdId }),
      });

      if (response.ok) {
        setSavedJDs(prev => prev.filter(jd => jd.id !== jdId));
      }
    } catch (error) {
      console.error('Error deleting JD:', error);
    }
  };

  const handleUseSavedJD = (savedJD: SavedJD) => {
    setJdText(savedJD.jdText);
    setKeywords(savedJD.keywords);
    setJDAnalysis(savedJD.keywords, savedJD.analysis);
  };

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
        body: JSON.stringify({ 
          jdText,
          cvId: state.cvData?.id,
          language: state.cvData?.language || 'vi'
        }),
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
        
        // Reload saved JDs to show the newly saved one
        loadSavedJDs();
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
        {/* Saved JDs Section */}
        {savedJDs.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">JD đã lưu</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {savedJDs.map((savedJD) => (
                <div key={savedJD.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {savedJD.preview}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(savedJD.createdAt).toLocaleDateString('vi-VN')} • {savedJD.keywords.length} từ khóa
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <button
                      onClick={() => handleUseSavedJD(savedJD)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Sử dụng
                    </button>
                    <button
                      onClick={() => handleDeleteJD(savedJD.id)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="jd-text" className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả công việc mới
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
