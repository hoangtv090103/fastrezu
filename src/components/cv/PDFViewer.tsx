"use client";

import { useState, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import BlockNoteEditor from "./BlockNoteEditor";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Add polyfills for server-side rendering
if (typeof window !== "undefined") {
  // Polyfill for DOMMatrix
  if (!window.DOMMatrix) {
    window.DOMMatrix = class DOMMatrix {
      constructor() {
        // Simple polyfill implementation
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
      }
      a: number;
      b: number;
      c: number;
      d: number;
      e: number;
      f: number;
    } as unknown as typeof DOMMatrix;
  }
}

interface PDFViewerProps {
  file: File | string | null;
  extractedText: string;
  onTextChange: (text: string) => void;
}

export default function PDFViewer({
  file,
  extractedText,
  onTextChange,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [pageWidth, setPageWidth] = useState<number>(595); // Default A4 width
  const [customZoomInput, setCustomZoomInput] = useState<string>("100");

  // Calculate optimal scale to fit container width
  const calculateOptimalScale = useCallback(() => {
    if (containerWidth > 0 && pageWidth > 0) {
      return Math.min(containerWidth / pageWidth, 2.0); // Max scale 200%
    }
    return 1.0;
  }, [containerWidth, pageWidth]);

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== "undefined") {
        const pdfContainer = document.querySelector(".pdf-container");
        if (pdfContainer) {
          const rect = pdfContainer.getBoundingClientRect();
          const padding = 32; // Account for padding
          setContainerWidth(rect.width - padding);
        }
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Auto-adjust scale when container width changes
  useEffect(() => {
    if (containerWidth > 0 && pageWidth > 0) {
      const optimalScale = calculateOptimalScale();
      setScale(optimalScale);
    }
  }, [containerWidth, pageWidth, calculateOptimalScale]);

  // Update custom zoom input when scale changes from buttons
  useEffect(() => {
    // Only update customZoomInput if it's empty (user hasn't typed anything)
    if (customZoomInput === "") {
      setCustomZoomInput(Math.round(scale * 100).toString());
    }
  }, [scale]);

  const onDocumentLoadSuccess = useCallback(
    async (document: {
      numPages: number;
      getPage: (
        pageNumber: number
      ) => Promise<{
        getViewport: (options: { scale: number }) => { width: number };
      }>;
    }) => {
      const { numPages } = document;
      setNumPages(numPages);
      setPageNumber(1);
      setLoading(false);
      setError(null);

      // Get actual page width and calculate optimal scale
      try {
        // Use the document object directly to get page
        const page = await document.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        setPageWidth(viewport.width);

        // Calculate and set optimal scale to fit width
        const optimalScale = calculateOptimalScale();
        setScale(optimalScale);
      } catch (err) {
        console.error("Error getting page dimensions:", err);
        setScale(1.0);
      }
    },
    [calculateOptimalScale]
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("Error loading PDF:", error);
    setError(error.message);
    setLoading(false);
  }, []);

  const onDocumentLoadStart = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    const newScale = Math.min(scale + 0.2, 5.0);
    setScale(newScale);
    setCustomZoomInput(Math.round(newScale * 100).toString());
  }, [scale]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(scale - 0.2, 0.1);
    setScale(newScale);
    setCustomZoomInput(Math.round(newScale * 100).toString());
  }, [scale]);

  const resetZoom = useCallback(() => {
    const optimalScale = calculateOptimalScale();
    setScale(optimalScale);
    setCustomZoomInput(Math.round(optimalScale * 100).toString());
  }, [calculateOptimalScale]);

  const handleCustomZoom = useCallback((value: string) => {
    setCustomZoomInput(value);

    // Parse the input value
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      // Convert percentage to scale (e.g., 100% = 1.0)
      const newScale = Math.min(Math.max(numericValue / 100, 0.1), 5.0); // Min 10%, Max 500%
      setScale(newScale);
    } else if (value === "") {
      // If input is empty, don't change the scale, just keep the input empty
      // The user can type a new value
    }
  }, []);

  const handleZoomInputKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleCustomZoom(customZoomInput);
      }
    },
    [customZoomInput, handleCustomZoom]
  );

  if (!file) {
    return (
      <div className="flex h-96 items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500">Chưa có file PDF để hiển thị</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Left side - Extracted Text */}
      <div className="flex-1 border-r-0 lg:border-r border-gray-300 p-3 lg:p-4 lg:min-w-0 flex flex-col">
        <div className="mb-3 lg:mb-4">
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">
            Văn bản đã trích xuất
          </h3>
          <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4">
            Xem lại và chỉnh sửa văn bản đã trích xuất từ CV của bạn. Bạn có thể
            so sánh với bản PDF gốc ở bên phải.
          </p>
        </div>

        <div className="flex-1 min-h-0">
          <BlockNoteEditor
            value={extractedText}
            onChange={onTextChange}
            placeholder="Văn bản đã trích xuất sẽ xuất hiện ở đây..."
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Right side - PDF Viewer */}
      <div className="flex-1 flex flex-col lg:min-w-0">
        {/* PDF Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 lg:p-4 border-b border-gray-300 bg-gray-50 gap-3 sm:gap-0">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-white rounded-lg border border-gray-300 shadow-sm">
              <button
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="px-3 py-2 text-sm bg-white border-r border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              >
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <span className="px-3 py-2 text-sm text-gray-700 bg-gray-50 font-medium min-w-[80px] text-center">
                {pageNumber} / {numPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={pageNumber >= numPages}
                className="px-3 py-2 text-sm bg-white border-l border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              >
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Zoom and Fit Controls */}
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white rounded-lg border border-gray-300 shadow-sm">
              <button
                onClick={zoomOut}
                className="px-3 py-2 text-sm bg-white border-r border-gray-300 rounded-l-lg hover:bg-gray-50 transition-colors"
              >
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
                    d="M20 12H4"
                  />
                </svg>
              </button>
              <div className="flex items-center border-r border-gray-300">
                <input
                  type="text"
                  value={customZoomInput}
                  onChange={(e) => setCustomZoomInput(e.target.value)}
                  onKeyPress={handleZoomInputKeyPress}
                  onBlur={() => handleCustomZoom(customZoomInput)}
                  className="px-2 py-2 text-sm text-gray-700 bg-gray-50 font-medium min-w-[60px] text-center border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                  placeholder="100"
                />
                <span className="px-1 text-xs text-gray-500">%</span>
              </div>
              <button
                onClick={zoomIn}
                className="px-3 py-2 text-sm bg-white border-l border-gray-300 rounded-r-lg hover:bg-gray-50 transition-colors"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>

            {/* Fit Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={resetZoom}
                className="px-3 py-2 text-xs sm:text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-sm"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* PDF Display */}
        <div className="flex-1 overflow-auto p-2 lg:p-4 bg-gray-100 pdf-container">
          {loading && (
            <div className="flex items-center justify-center h-32 sm:h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm sm:text-base">
                  Đang tải PDF...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-32 sm:h-64">
              <div className="text-center">
                <svg
                  className="w-8 h-8 sm:w-12 sm:h-12 text-red-400 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <p className="text-red-600 font-medium text-sm sm:text-base">
                  Lỗi tải PDF
                </p>
                <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="flex justify-center items-center min-h-full">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                onLoadStart={onDocumentLoadStart}
                loading={<div>Đang tải PDF...</div>}
                error={<div>Không thể tải PDF</div>}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  className="shadow-lg"
                  width={Math.min(containerWidth, pageWidth * scale)}
                />
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
