"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import CVTemplate from "@/components/cv/CVTemplate";
import {
  showSuccessToast,
  showErrorToast,
  showLoadingToast,
  updateToast,
} from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";

interface CVSection {
  section_type: string;
  data: Record<string, unknown>;
  order_index: number;
}

interface CV {
  id: string;
  title: string;
  ats_score: number;
  language: "vi" | "en";
  updated_at: string;
  created_at: string;
  cv_sections: CVSection[];
}

interface CVPreviewCardProps {
  cv: CV;
  onDelete: (cvId: string) => void;
}

export default function CVPreviewCard({ cv, onDelete }: CVPreviewCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Convert cv_sections to the format expected by CVTemplate
  const convertSectionsToCVData = (cv: CV) => {
    const sections: {
      [key: string]: Record<string, unknown> | Record<string, unknown>[];
    } = {};

    if (cv.cv_sections && cv.cv_sections.length > 0) {
      cv.cv_sections.forEach((section) => {
        sections[section.section_type] = section.data;
      });
    }

    return {
      id: cv.id,
      title: cv.title,
      language: cv.language,
      ats_score: cv.ats_score,
      sections: sections,
    };
  };

  // Check if CV has meaningful content to display
  const hasContent = (cv: CV) => {
    if (!cv.cv_sections || cv.cv_sections.length === 0) return false;

    // Check if any section has actual data
    return cv.cv_sections.some((section) => {
      if (!section.data) return false;

      // Check for different section types
      switch (section.section_type) {
        case "personal_info":
          return (
            section.data.full_name || section.data.email || section.data.phone
          );
        case "summary":
          return (
            section.data.content &&
            typeof section.data.content === "string" &&
            section.data.content.trim().length > 0
          );
        case "experience":
          return Array.isArray(section.data) && section.data.length > 0;
        case "education":
          return Array.isArray(section.data) && section.data.length > 0;
        case "skills":
          return (
            (Array.isArray(section.data.technical) &&
              section.data.technical.length > 0) ||
            (Array.isArray(section.data.soft) && section.data.soft.length > 0)
          );
        default:
          return Object.keys(section.data).length > 0;
      }
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const handleDownloadPDF = async () => {
    if (!hasContent(cv)) {
      showErrorToast(
        "CV chưa có nội dung để tải xuống. Vui lòng chỉnh sửa CV trước.",
        "vi"
      );
      return;
    }

    setIsDownloading(true);
    const toastId = showLoadingToast("Đang tạo PDF...");

    try {
      // Convert CV data to the format expected by the PDF API
      const cvData = convertSectionsToCVData(cv);

      // Call the server-side PDF export API
      const response = await fetch("/api/cv/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cvData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename from response headers or fallback
      const contentDisposition = response.headers.get("content-disposition");
      let filename = "cv.pdf";

      if (contentDisposition) {
        const filenameMatch =
          contentDisposition.match(/filename="([^"]*)"/) ||
          contentDisposition.match(/filename=([^;]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].trim();
        }
      } else {
        // Fallback filename generation
        const sanitizedTitle = (cv.title || "CV")
          .replace(/[^a-zA-Z0-9\s]/g, "")
          .trim();
        filename = `${sanitizedTitle}_${
          new Date().toISOString().split("T")[0]
        }.pdf`;
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      updateToast(toastId, "PDF đã được tải xuống thành công!", "success");
    } catch (error) {
      console.error("Error generating PDF:", error);
      const appError = handleAPIError(error, "generate PDF", "vi");
      updateToast(toastId, appError.userMessage, "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/editor/${cv.id}`);
  };

  const handleDelete = () => {
    if (confirm("Bạn có chắc chắn muốn xóa CV này?")) {
      onDelete(cv.id);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDropdown(false);
      }}
    >
      {/* CV Preview */}
      <div className="h-80 overflow-hidden relative">
        <div className="h-full overflow-y-auto p-4 bg-gray-50 hide-scrollbar relative z-0">
          {hasContent(cv) ? (
            <div className="transform scale-50 origin-top-left w-[200%] h-[200%] hide-scrollbar">
              <CVTemplate cvData={convertSectionsToCVData(cv)} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400">📄</span>
                </div>
                <p className="text-sm text-gray-500">CV chưa có nội dung</p>
                <p className="text-xs text-gray-400 mt-1">
                  Nhấn &quot;Chỉnh sửa&quot; để thêm thông tin
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Overlay with actions */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-10">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-white hover:bg-gray-100 disabled:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 shadow-lg"
              >
                {isDownloading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
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
                )}
                <span className="text-sm font-medium">
                  {isDownloading ? "Đang tải..." : "Tải về"}
                </span>
              </button>

              <button
                onClick={handleEdit}
                className="bg-white hover:bg-gray-100 text-gray-800 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 shadow-lg"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="text-sm font-medium">Chỉnh sửa</span>
              </button>

              {/* Three-dot menu button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                  className="bg-white hover:bg-gray-100 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div
                    className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px]"
                    style={{ zIndex: 9999 }}
                  >
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        // TODO: Implement copy link
                        showSuccessToast('Đã sao chép liên kết!');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Sao chép liên kết</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        // TODO: Implement duplicate CV
                        showSuccessToast('Đã tạo bản sao CV!');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                      <span>Tạo bản sao</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        // TODO: Implement rename CV
                        const newName = prompt('Nhập tên mới cho CV:', cv.title);
                        if (newName && newName.trim()) {
                          showSuccessToast('Đã đổi tên CV!');
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Đổi tên</span>
                    </button>
                    
                    <hr className="my-1" /> */}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdown(false);
                        handleDelete();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Xóa</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CV Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 mr-2">
            <h3 className="heading-feature text-lg text-gray-900 truncate">
              {cv.title}
            </h3>
            {!hasContent(cv) && (
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                <span className="text-xs text-yellow-600 font-medium">
                  Chưa hoàn thiện
                </span>
              </div>
            )}
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(
              cv.ats_score
            )}`}
          >
            {cv.ats_score}/100
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="small-text text-gray-500">
            Cập nhật:{" "}
            {format(new Date(cv.updated_at), "dd/MM/yyyy", { locale: vi })}
          </p>
          <span
            className="text-lg font-medium text-gray-500"
            title={cv.language === "vi" ? "Tiếng Việt" : "English"}
          >
            {cv.language === "vi" ? "VN" : "EN"}
          </span>
        </div>
      </div>
    </div>
  );
}
