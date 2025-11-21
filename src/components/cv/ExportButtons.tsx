"use client";

import { CVData } from "@/contexts/CVEditorContext";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";
import dynamic from "next/dynamic";
import { useTranslation } from "@/hooks/useTranslation";

// Dynamic import to avoid SSR issues with @react-pdf/renderer and React 19
const PDFDownloadButton = dynamic(
  () => import("@/components/cv/PDFDownloadButton"),
  {
    ssr: false,
    loading: () => (
      <button
        className="relative bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center"
        disabled
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      </button>
    ),
  }
);

interface ExportButtonsProps {
  cvData: CVData;
}

export default function ExportButtons({ cvData }: ExportButtonsProps) {
  const { t } = useTranslation();

  // Lấy tên file
  const sanitizedTitle = (cvData.title || "CV")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();
  const fileName = `${sanitizedTitle}_${
    new Date().toISOString().split("T")[0]
  }.pdf`;

  const handleCopyAsText = () => {
    try {
      // Create text version of CV
      const personalInfo =
        (cvData.sections.personal_info as Record<string, unknown>) || {};
      const summary =
        (cvData.sections.summary as Record<string, unknown>) || {};
      const experience =
        (cvData.sections.experience as unknown as Record<string, unknown>[]) ||
        [];
      const education =
        (cvData.sections.education as unknown as Record<string, unknown>[]) ||
        [];
      const skills = (cvData.sections.skills as Record<string, unknown>) || {};

      const getString = (obj: Record<string, unknown>, key: string): string => {
        const value = obj[key];
        return typeof value === "string" ? value : "";
      };

      let textCV = "";

      // Header
      textCV += `${getString(personalInfo, "full_name") || "Họ và tên"}\n`;
      textCV += `${getString(personalInfo, "email") || ""} | ${
        getString(personalInfo, "phone") || ""
      } | ${getString(personalInfo, "location") || ""}\n`;
      textCV += `${
        getString(personalInfo, "linkedin")
          ? `LinkedIn: ${getString(personalInfo, "linkedin")}`
          : ""
      }\n\n`;

      // Summary
      if (getString(summary, "content")) {
        textCV += `TÓM TẮT NGHỀ NGHIỆP\n`;
        textCV += `${getString(summary, "content")}\n\n`;
      }

      // Experience
      if (experience.length > 0) {
        textCV += `KINH NGHIỆM LÀM VIỆC\n`;
        experience.forEach((exp: Record<string, unknown>) => {
          textCV += `${exp.job_title || "Chức vụ"} - ${
            exp.company || "Công ty"
          }\n`;
          textCV += `${exp.start_date || ""} - ${exp.end_date || ""} | ${
            exp.location || ""
          }\n`;
          if (Array.isArray(exp.achievements)) {
            exp.achievements.forEach((achievement: string) => {
              textCV += `• ${achievement}\n`;
            });
          }
          textCV += "\n";
        });
      }

      // Education
      if (education.length > 0) {
        textCV += `HỌC VẤN\n`;
        education.forEach((edu: Record<string, unknown>) => {
          textCV += `${edu.degree || "Bằng cấp"} - ${edu.school || "Trường"}\n`;
          textCV += `${edu.graduation_date || ""} | ${
            edu.field_of_study || ""
          }\n\n`;
        });
      }

      // Skills
      if (
        (Array.isArray(skills.technical) && skills.technical.length > 0) ||
        (Array.isArray(skills.soft) && skills.soft.length > 0)
      ) {
        textCV += `KỸ NĂNG\n`;
        if (Array.isArray(skills.technical) && skills.technical.length > 0) {
          textCV += `Kỹ thuật: ${(skills.technical as string[]).join(", ")}\n`;
        }
        if (Array.isArray(skills.soft) && skills.soft.length > 0) {
          textCV += `Mềm: ${(skills.soft as string[]).join(", ")}\n`;
        }
      }

      // Copy to clipboard
      navigator.clipboard
        .writeText(textCV)
        .then(() => {
          showSuccessToast(t("cv.export.copySuccess"));
        })
        .catch((err) => {
          const appError = handleAPIError(err, "copy to clipboard", "vi");
          showErrorToast(appError, "vi");
        });
    } catch (error) {
      console.error("Error copying text:", error);
      const appError = handleAPIError(error, "copy text", "vi");
      showErrorToast(appError, "vi");
    }
  };

  return (
    <div className="flex space-x-2">
      {/* Nút Tải PDF */}
      <PDFDownloadButton cvData={cvData} fileName={fileName} />

      {/* Nút Copy Text */}
      <button
        onClick={handleCopyAsText}
        className="relative bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center group"
        title="Sao chép văn bản"
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
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        {/* Tooltip */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          Sao chép văn bản
        </div>
      </button>
    </div>
  );
}
