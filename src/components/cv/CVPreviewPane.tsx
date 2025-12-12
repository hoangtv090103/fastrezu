"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PendingCV } from "@/lib/pending-cv-storage";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface CVPreviewPaneProps {
  pendingCV: PendingCV;
}

export default function CVPreviewPane({ pendingCV }: CVPreviewPaneProps) {
  const [pageLoaded, setPageLoaded] = useState(false);
  const [error, setError] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(500);

  const isPDF =
    pendingCV.type === "application/pdf" ||
    pendingCV.name.toLowerCase().endsWith(".pdf");

  // Calculate container width for responsive PDF sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Calculate width to fit with some padding
        const width = Math.min(containerRef.current.clientWidth - 64, 600);
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const onDocumentLoadSuccess = () => {
    setPageLoaded(true);
    setError("");
  };

  const onDocumentLoadError = (err: Error) => {
    console.error("PDF load error:", err);
    setError("Không thể tải bản xem trước PDF");
  };

  if (!isPDF) {
    // For DOCX files, show file info placeholder
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white rounded shadow-xl p-12 text-center max-w-md">
          <svg
            className="w-20 h-20 text-gray-300 mx-auto mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-600 font-medium mb-2">{pendingCV.name}</p>
          <p className="text-gray-400 text-sm">
            {(pendingCV.size / 1024).toFixed(1)} KB
          </p>
          <p className="text-gray-400 text-xs mt-4">
            Xem trước không khả dụng cho file DOCX
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center h-full w-full"
    >
      {error ? (
        <div className="flex items-center justify-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : (
        <Document
          file={pendingCV.data}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Đang tải PDF...</div>
            </div>
          }
          className="flex items-center justify-center"
        >
          {/* Only show the first page, fitted to container */}
          <Page
            pageNumber={1}
            width={containerWidth}
            className="shadow-2xl bg-white"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      )}
    </div>
  );
}
