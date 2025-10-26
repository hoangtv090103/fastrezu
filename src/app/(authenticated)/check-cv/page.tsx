"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import PDFViewerWrapper from "@/components/cv/PDFViewerWrapper";

interface ScoreResult {
  score: number;
  analysis: {
    keyword_match: number;
    formatting: number;
    completeness: number;
    relevance: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  metadata: {
    hasJobDescription: boolean;
    textLength: number;
    language: string;
    timestamp: string;
  };
}

export default function CheckCVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoadingUpload, setIsLoadingUpload] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [isConfirmingText, setIsConfirmingText] = useState(false);
  const [jdText, setJdText] = useState("");
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'jd' | 'results'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setScoreResult(null);
      setCurrentStep('upload');
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError("Vui lòng chọn file trước");
      return;
    }

    setIsLoadingUpload(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/cv/upload-check", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setEditedText(data.extractedText);
      setCurrentStep('review');
      toast.success("Tải lên file và trích xuất văn bản thành công!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingUpload(false);
    }
  };

  const handleConfirmText = () => {
    if (!editedText.trim()) {
      setError("Vui lòng xem lại và xác nhận văn bản");
      return;
    }
    setIsConfirmingText(true);
    setCurrentStep('jd');
    toast.success("Văn bản đã được xác nhận! Bây giờ bạn có thể thêm mô tả công việc (tùy chọn).");
  };

  const handleScoreCV = async () => {
    if (!editedText.trim()) {
      setError("Vui lòng xác nhận văn bản trước");
      return;
    }

    setIsLoadingScore(true);
    setError("");

    try {
      const response = await fetch("/api/ai/score-uploaded-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmedText: editedText,
          jdText: jdText.trim() || undefined,
          language: 'vi', // Default to Vietnamese, could be made configurable
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Scoring failed");
      }

      setScoreResult(data);
      setCurrentStep('results');
      toast.success("Chấm điểm CV thành công!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Scoring failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingScore(false);
    }
  };

  const resetProcess = () => {
    setFile(null);
    setEditedText("");
    setJdText("");
    setScoreResult(null);
    setError("");
    setCurrentStep('upload');
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Kiểm tra CV
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Tải lên CV hiện tại của bạn để nhận điểm ATS và gợi ý cải thiện.
              </p>
            </div>
            
            {/* Compact Step Indicator */}
            <div className="flex items-center space-x-1 sm:space-x-2 ml-4">
              {[
                { key: 'upload', label: 'Tải lên', icon: '📁' },
                { key: 'review', label: 'Kiểm tra', icon: '✏️' },
                { key: 'jd', label: 'Mô tả công việc', icon: '📋' },
                { key: 'results', label: 'Kết quả', icon: '📊' },
              ].map((step, index) => (
                <div key={step.key} className="relative group">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      currentStep === step.key
                        ? 'bg-blue-600 text-white shadow-lg'
                        : ['upload', 'review', 'jd', 'results'].indexOf(currentStep) > index
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {['upload', 'review', 'jd', 'results'].indexOf(currentStep) > index ? '✓' : step.icon}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {step.label}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                  
                  {/* Connector line */}
                  {index < 3 && (
                    <div className={`absolute top-1/2 left-full w-2 sm:w-4 h-0.5 transform -translate-y-1/2 ${
                      ['upload', 'review', 'jd', 'results'].indexOf(currentStep) > index
                        ? 'bg-green-600'
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: Upload */}
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tải lên file CV
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-lg font-medium text-gray-700">
                    {file ? file.name : "Nhấp để tải lên PDF hoặc DOCX"}
                  </span>
                  <span className="text-sm text-gray-500 mt-1">
                    Kích thước file tối đa: 10MB
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={handleFileUpload}
              disabled={!file || isLoadingUpload}
              className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoadingUpload ? "Đang tải lên và trích xuất văn bản..." : "Tải lên & trích xuất văn bản"}
            </button>
          </div>
        )}

        {/* Step 2: Review Text */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xem lại và sửa văn bản đã trích xuất
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Vui lòng xem lại văn bản đã trích xuất và so sánh với bản PDF gốc. 
                Bạn có thể chỉnh sửa văn bản ở bên trái và xem PDF gốc ở bên phải.
              </p>
            </div> */}

            {/* PDF Viewer with responsive split layout */}
            <div className="border border-gray-300 rounded-lg overflow-hidden h-[500px] sm:h-[600px] lg:h-[700px]">
              <PDFViewerWrapper
                file={file}
                extractedText={editedText}
                onTextChange={setEditedText}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setCurrentStep('upload')}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Quay lại
              </button>
              <button
                onClick={handleConfirmText}
                disabled={!editedText.trim() || isConfirmingText}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base"
              >
                {isConfirmingText ? "Đang xác nhận..." : "Tiếp tục"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Job Description */}
        {currentStep === 'jd' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả công việc (Tùy chọn)
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Dán mô tả công việc để nhận điểm ATS chính xác hơn dựa trên việc khớp từ khóa.
              </p>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full h-48 p-4 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholder="Dán mô tả công việc ở đây (tùy chọn)..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setCurrentStep('review')}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Quay lại
              </button>
              <button
                onClick={handleScoreCV}
                disabled={isLoadingScore}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm sm:text-base"
              >
                {isLoadingScore ? "Đang phân tích CV..." : "Kiểm tra điểm ATS"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 'results' && scoreResult && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {scoreResult.score}/100
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Điểm ATS
              </h2>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {scoreResult.analysis.keyword_match}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Khớp từ khóa</div>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {scoreResult.analysis.formatting}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Định dạng</div>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {scoreResult.analysis.completeness}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Đầy đủ</div>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">
                  {scoreResult.analysis.relevance}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Liên quan</div>
              </div>
            </div>

            {/* Keywords */}
            {scoreResult.matchedKeywords.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Từ khóa khớp
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scoreResult.matchedKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {scoreResult.missingKeywords.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Từ khóa thiếu
                </h3>
                <div className="flex flex-wrap gap-2">
                  {scoreResult.missingKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {scoreResult.suggestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Gợi ý cải thiện
                </h3>
                <ul className="space-y-2">
                  {scoreResult.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Điểm ATS này dựa trên văn bản đã trích xuất từ file bạn tải lên. 
                Độ chính xác của điểm số phụ thuộc vào chất lượng trích xuất văn bản, có thể thay đổi tùy theo bố cục phức tạp 
                hoặc file có định dạng nặng. Để có kết quả tốt nhất, hãy đảm bảo CV của bạn ở định dạng đơn giản, thân thiện với ATS.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={resetProcess}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                Kiểm tra CV khác
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}