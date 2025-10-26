"use client";

import dynamic from "next/dynamic";

// Dynamically import PDFViewer with no SSR
const PDFViewer = dynamic(() => import("./PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Đang tải PDF viewer...</p>
      </div>
    </div>
  ),
});

interface PDFViewerWrapperProps {
  file: File | string | null;
  extractedText: string;
  onTextChange: (text: string) => void;
}

export default function PDFViewerWrapper({ file, extractedText, onTextChange }: PDFViewerWrapperProps) {
  return (
    <PDFViewer
      file={file}
      extractedText={extractedText}
      onTextChange={onTextChange}
    />
  );
}
