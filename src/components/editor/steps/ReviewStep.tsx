"use client";

import { useState, useEffect, useCallback } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import AIAssistButton from "@/components/ui/AIAssistButton";
import KeywordTag from "@/components/ui/KeywordTag";
import ExportButtons from "@/components/cv/ExportButtons";
import ATSOptimizationPanel from "@/components/editor/ATSOptimizationPanel";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { parseMarkdown } from "@/lib/markdown";

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
  const { state, updateCVData, saveCV, setCurrentStep } = useCVEditor();
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  const handleNavigateToSection = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, [setCurrentStep]);

  // Initialize scoring result from existing CV data if available
  useEffect(() => {
    if (state.cvData?.ats_score && state.cvData?.ats_analysis && !scoringResult) {
      setScoringResult({
        score: state.cvData.ats_score,
        suggestions: state.cvData.ats_analysis.suggestions || [],
        analysis: {
          keyword_match: state.cvData.ats_analysis.keyword_match || 0,
          formatting: state.cvData.ats_analysis.formatting || 0,
          completeness: state.cvData.ats_analysis.completeness || 0,
          relevance: state.cvData.ats_analysis.relevance || 0,
        },
        matchedKeywords: state.cvData.ats_analysis.matched_keywords || [],
        missingKeywords: state.cvData.ats_analysis.missing_keywords || [],
      });
    }
  }, [state.cvData?.ats_score, state.cvData?.ats_analysis, scoringResult]);

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
        
        // Validate and normalize the result
        const normalizedResult = {
          score: Math.round(result.score || 0),
          analysis: {
            keyword_match: Math.min(100, Math.max(0, Math.round(result.analysis?.keyword_match || 0))),
            formatting: Math.min(100, Math.max(0, Math.round(result.analysis?.formatting || 0))),
            completeness: Math.min(100, Math.max(0, Math.round(result.analysis?.completeness || 0))),
            relevance: Math.min(100, Math.max(0, Math.round(result.analysis?.relevance || 0)))
          },
          matchedKeywords: result.matchedKeywords || [],
          missingKeywords: result.missingKeywords || [],
          suggestions: result.suggestions || []
        };
        
        console.log('ATS Scoring Result:', normalizedResult);
        setScoringResult(normalizedResult);
        
        // Update CV data with ATS score and analysis
        if (state.cvData && normalizedResult.score !== undefined) {
          const updatedCVData = {
            ...state.cvData,
            ats_score: normalizedResult.score,
            ats_analysis: {
              keyword_match: normalizedResult.analysis.keyword_match,
              formatting: normalizedResult.analysis.formatting,
              completeness: normalizedResult.analysis.completeness,
              relevance: normalizedResult.analysis.relevance,
              matched_keywords: normalizedResult.matchedKeywords,
              missing_keywords: normalizedResult.missingKeywords,
              suggestions: normalizedResult.suggestions
            }
          };
          
          // Update context with new data
          updateCVData(updatedCVData);
          
          // Save to database
          try {
            await saveCV();
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

  // Auto-score when component mounts if we have JD analysis but no existing ATS score
  useEffect(() => {
    if (state.cvData?.jd_analysis && !scoringResult && !state.cvData?.ats_score) {
      handleScoreCV();
    }
  }, [state.cvData?.jd_analysis, state.cvData?.ats_score, handleScoreCV, scoringResult]);

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
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="heading-feature text-base sm:text-lg text-gray-900 mb-2">
          Xem lại & Chấm điểm CV
        </h3>
        <p className="body-text text-gray-600 mb-4 text-sm sm:text-base">
          Kiểm tra điểm ATS và nhận gợi ý cải thiện CV của bạn.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
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
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {Math.round(scoringResult.analysis?.keyword_match || 0)}%
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-xs text-gray-600">Từ khóa khớp</div>
                    <div className="mt-0.5">
                      <InfoTooltip
                        id="keyword-match-tooltip"
                        title="Từ khóa khớp"
                        content="Tỷ lệ phần trăm từ khóa trong mô tả công việc (JD) có xuất hiện trong CV của bạn. Điểm cao hơn giúp CV vượt qua hệ thống ATS dễ dàng hơn."
                        placement="bottom"
                        icon="info"
                        dismissible={true}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {Math.round(scoringResult.analysis?.completeness || 0)}%
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-xs text-gray-600">Hoàn thiện</div>
                    <div className="mt-0.5">
                      <InfoTooltip
                        id="completeness-tooltip"
                        title="Độ hoàn thiện"
                        content="Đánh giá mức độ đầy đủ của CV: có đủ các phần quan trọng (kinh nghiệm, học vấn, kỹ năng), nội dung chi tiết với số liệu cụ thể, và độ dài phù hợp."
                        placement="bottom"
                        icon="info"
                        dismissible={true}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">
                    {Math.round(scoringResult.analysis?.formatting || 0)}%
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-xs text-gray-600">Định dạng</div>
                    <div className="mt-0.5">
                      <InfoTooltip
                        id="formatting-tooltip"
                        title="Định dạng"
                        content="Đánh giá cấu trúc và định dạng CV: các phần được sắp xếp rõ ràng, tiêu đề phù hợp, dễ đọc và thân thiện với hệ thống ATS."
                        placement="bottom"
                        icon="info"
                        dismissible={true}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">
                    {Math.round(scoringResult.analysis?.relevance || 0)}%
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-xs text-gray-600">Liên quan</div>
                    <div className="mt-0.5">
                      <InfoTooltip
                        id="relevance-tooltip"
                        title="Độ liên quan"
                        content="Đánh giá mức độ phù hợp của kinh nghiệm và kỹ năng trong CV với yêu cầu công việc. Nội dung càng liên quan, cơ hội được chọn càng cao."
                        placement="bottom"
                        icon="info"
                        dismissible={true}
                      />
                    </div>
                  </div>
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
                  <div className="space-y-1">
                    {scoringResult.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="text-sm text-gray-600">
                        {parseMarkdown(suggestion)}
                      </div>
                    ))}
                  </div>
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

        {/* ATS Optimization Panel - Show only when there are missing keywords */}
        {scoringResult && scoringResult.missingKeywords && scoringResult.missingKeywords.length > 0 && state.cvData && (
          <ATSOptimizationPanel
            missingKeywords={scoringResult.missingKeywords}
            cvData={state.cvData}
            onNavigateToSection={handleNavigateToSection}
          />
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            ← Quay lại
          </button>
          
          {/* Export Buttons */}
          {state.cvData && <ExportButtons cvData={state.cvData} />}
        </div>
      </div>
    </div>
  );
}
