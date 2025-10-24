"use client";

import { useState, useEffect, useCallback } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import AIAssistButton from "@/components/ui/AIAssistButton";
import KeywordTag from "@/components/ui/KeywordTag";
import ExportButtons from "@/components/cv/ExportButtons";

interface ScoringResult {
  score: number;
  suggestions: string[];
  analysis: {
    keyword_match: number;
    formatting: number;
    completeness: number;
    relevance: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
}

export default function ReviewStep() {
  const { state, updateCVData, saveCV } = useCVEditor();
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  const handleScoreCV = useCallback(async () => {
    if (!state.cvData) return;

    setIsScoring(true);
    try {
      const response = await fetch('/api/ai/score-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvData: state.cvData,
          jdKeywords: state.cvData.jd_analysis?.keywords || [],
          language: state.cvData?.language || 'vi'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setScoringResult(result);
        
        // Update CV data with ATS score and analysis
        if (state.cvData && result.score !== undefined) {
          const updatedCVData = {
            ...state.cvData,
            ats_score: result.score,
            ats_analysis: {
              keyword_match: result.analysis?.keyword_match || 0,
              formatting: result.analysis?.formatting || 0,
              completeness: result.analysis?.completeness || 0,
              relevance: result.analysis?.relevance || 0,
              matched_keywords: result.matchedKeywords || [],
              missing_keywords: result.missingKeywords || [],
              suggestions: result.suggestions || []
            }
          };
          
          // Update context with new data
          updateCVData(updatedCVData);
          
          // Save to database
          try {
            await saveCV();
            console.log('ATS score saved to database:', result.score);
          } catch (error) {
            console.error('Failed to save ATS score to database:', error);
          }
        }
      } else {
        console.error('Failed to score CV');
      }
    } catch (error) {
      console.error('Error scoring CV:', error);
    } finally {
      setIsScoring(false);
    }
  }, [state.cvData, updateCVData, saveCV]);

  // Auto-score when component mounts if we have JD analysis
  useEffect(() => {
    if (state.cvData?.jd_analysis && !scoringResult) {
      handleScoreCV();
    }
  }, [state.cvData?.jd_analysis, handleScoreCV, scoringResult]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          Xem lại & Chấm điểm CV
        </h3>
        <p className="body-text text-gray-600 mb-4">
          Kiểm tra điểm ATS và nhận gợi ý cải thiện CV của bạn.
        </p>
      </div>

      <div className="space-y-6">
        {/* JD Analysis Summary */}
        {state.cvData?.jd_analysis && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Từ khóa JD đã phân tích:
            </h4>
            <div className="flex flex-wrap gap-2">
              {state.cvData.jd_analysis.keywords.map((keyword: string, index: number) => (
                <KeywordTag key={index} keyword={keyword} />
              ))}
            </div>
          </div>
        )}

        {/* Scoring Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Điểm ATS
            </h4>
            <AIAssistButton
              onClick={handleScoreCV}
              loading={isScoring}
              label="Chấm điểm CV"
              disabled={!state.cvData}
            />
          </div>

          {scoringResult ? (
            <div className="space-y-4">
              {/* Score Display */}
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(scoringResult.score)}`}>
                  <span className={`text-3xl font-bold ${getScoreColor(scoringResult.score)}`}>
                    {scoringResult.score}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Điểm ATS / 100</p>
              </div>

              {/* Analysis Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {scoringResult.analysis?.keyword_match || 0}%
                  </div>
                  <div className="text-xs text-gray-600">Từ khóa khớp</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {scoringResult.analysis?.completeness || 0}%
                  </div>
                  <div className="text-xs text-gray-600">Hoàn thiện</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {scoringResult.analysis?.formatting || 0}%
                  </div>
                  <div className="text-xs text-gray-600">Định dạng</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {scoringResult.analysis?.relevance || 0}%
                  </div>
                  <div className="text-xs text-gray-600">Liên quan</div>
                </div>
              </div>

              {/* Keywords Analysis */}
              {scoringResult.matchedKeywords && scoringResult.matchedKeywords.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-green-700 mb-2">
                    ✓ Từ khóa đã khớp ({scoringResult.matchedKeywords.length || 0}):
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {scoringResult.matchedKeywords.map((keyword: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {scoringResult.missingKeywords && scoringResult.missingKeywords.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-700 mb-2">
                    ⚠️ Từ khóa còn thiếu ({scoringResult.missingKeywords.length}):
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {scoringResult.missingKeywords.map((keyword: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {scoringResult.suggestions && scoringResult.suggestions.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    💡 Gợi ý cải thiện:
                  </h5>
                  <ul className="space-y-1">
                    {scoringResult.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">📊</div>
              <p className="text-gray-600">
                {state.cvData?.jd_analysis 
                  ? "Đang chấm điểm CV..." 
                  : "Hãy phân tích JD trước để chấm điểm CV"
                }
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            ← Quay lại chỉnh sửa
          </button>
          
          {/* Export Buttons */}
          {state.cvData && <ExportButtons cvData={state.cvData} />}
        </div>
      </div>
    </div>
  );
}
