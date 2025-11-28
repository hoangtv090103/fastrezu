"use client";

import { useState } from "react";
import { CVData } from "@/contexts/CVEditorContext";

interface PDFDownloadButtonProps {
  cvData: CVData;
  fileName: string;
}

export default function PDFDownloadButton({
  cvData,
  fileName,
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Dynamically import to avoid SSR issues
      const [{ default: CVTemplatePDF }, { pdf }] = await Promise.all([
        import("@/components/cv/CVTemplatePDF"),
        import("@react-pdf/renderer"),
      ]);

      const blob = await pdf(<CVTemplatePDF cvData={cvData} />).toBlob();
      const url = URL.createObjectURL(blob);

      // Download the file
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();

      // Clean up after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Không thể tạo PDF. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="relative bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Đang tạo PDF...
          </div>
        </>
      ) : error ? (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {error}
          </div>
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Tải xuống PDF
          </div>
        </>
      )}
    </button>
  );
}
