"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import CVTemplatePDF from "@/components/cv/CVTemplatePDF";
import { CVData } from "@/contexts/CVEditorContext";

interface PDFDownloadButtonProps {
  cvData: CVData;
  fileName: string;
}

export default function PDFDownloadButton({ cvData, fileName }: PDFDownloadButtonProps) {
  return (
    <PDFDownloadLink
      document={<CVTemplatePDF cvData={cvData} />}
      fileName={fileName}
      className="relative bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center group"
      title="Tải xuống PDF"
    >
      {({ blob, url, loading, error }) => {
        if (loading) {
          return (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Đang tạo PDF...
              </div>
            </>
          );
        }
        if (error) {
          console.error("PDF Error:", error);
          return (
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
                Lỗi tạo PDF
              </div>
            </>
          );
        }
        // Icon tải xuống
        return (
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
        );
      }}
    </PDFDownloadLink>
  );
}
