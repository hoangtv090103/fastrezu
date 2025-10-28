"use client";

import { useState } from "react";
import { CVData } from "@/contexts/CVEditorContext";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";

interface ExportButtonsProps {
  cvData: CVData;
}

export default function ExportButtons({ cvData }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      // Call the server-side PDF export API
      const response = await fetch('/api/cv/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if there's a fallback suggestion
        if (errorData.fallbackAvailable && errorData.suggestion) {
          const appError = handleAPIError(
            { 
              message: errorData.error || 'PDF export failed',
              suggestion: errorData.suggestion 
            }, 
            'export PDF', 
            'vi'
          );
          
          // Show error with suggestion
          showErrorToast(
            `${appError.userMessage}\n\n${errorData.suggestion}`,
            'vi'
          );
          
          // Optionally auto-trigger text copy as fallback
          if (window.confirm('Không thể tạo PDF. Bạn có muốn sao chép nội dung dưới dạng văn bản không?')) {
            handleCopyAsText();
          }
          return;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename from response headers or fallback
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'cv.pdf';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]*)"/) ||
                              contentDisposition.match(/filename=([^;]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].trim();
        }
      } else {
        // Fallback filename generation
        const sanitizedTitle = (cvData.title || 'CV').replace(/[^a-zA-Z0-9\s]/g, '').trim();
        filename = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(url);

      // Show success message
      showSuccessToast('PDF đã được tạo thành công!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      const appError = handleAPIError(error, 'export PDF', 'vi');
      showErrorToast(appError, 'vi');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyAsText = () => {
    try {
      // Create text version of CV
      const personalInfo = (cvData.sections.personal_info as Record<string, unknown>) || {};
      const summary = (cvData.sections.summary as Record<string, unknown>) || {};
      const experience = (cvData.sections.experience as unknown as Record<string, unknown>[]) || [];
      const education = (cvData.sections.education as unknown as Record<string, unknown>[]) || [];
      const skills = (cvData.sections.skills as Record<string, unknown>) || {};

      const getString = (obj: Record<string, unknown>, key: string): string => {
        const value = obj[key];
        return typeof value === 'string' ? value : '';
      };

      let textCV = '';
      
      // Header
      textCV += `${getString(personalInfo, 'full_name') || 'Họ và tên'}\n`;
      textCV += `${getString(personalInfo, 'email') || ''} | ${getString(personalInfo, 'phone') || ''} | ${getString(personalInfo, 'location') || ''}\n`;
      textCV += `${getString(personalInfo, 'linkedin') ? `LinkedIn: ${getString(personalInfo, 'linkedin')}` : ''}\n\n`;

      // Summary
      if (getString(summary, 'content')) {
        textCV += `TÓM TẮT NGHỀ NGHIỆP\n`;
        textCV += `${getString(summary, 'content')}\n\n`;
      }

      // Experience
      if (experience.length > 0) {
        textCV += `KINH NGHIỆM LÀM VIỆC\n`;
        experience.forEach((exp: Record<string, unknown>) => {
          textCV += `${exp.job_title || 'Chức vụ'} - ${exp.company || 'Công ty'}\n`;
          textCV += `${exp.start_date || ''} - ${exp.end_date || ''} | ${exp.location || ''}\n`;
          if (Array.isArray(exp.achievements)) {
            exp.achievements.forEach((achievement: string) => {
              textCV += `• ${achievement}\n`;
            });
          }
          textCV += '\n';
        });
      }

      // Education
      if (education.length > 0) {
        textCV += `HỌC VẤN\n`;
        education.forEach((edu: Record<string, unknown>) => {
          textCV += `${edu.degree || 'Bằng cấp'} - ${edu.school || 'Trường'}\n`;
          textCV += `${edu.graduation_date || ''} | ${edu.field_of_study || ''}\n\n`;
        });
      }

      // Skills
      if ((Array.isArray(skills.technical) && skills.technical.length > 0) || 
          (Array.isArray(skills.soft) && skills.soft.length > 0)) {
        textCV += `KỸ NĂNG\n`;
        if (Array.isArray(skills.technical) && skills.technical.length > 0) {
          textCV += `Kỹ thuật: ${(skills.technical as string[]).join(', ')}\n`;
        }
        if (Array.isArray(skills.soft) && skills.soft.length > 0) {
          textCV += `Mềm: ${(skills.soft as string[]).join(', ')}\n`;
        }
      }

      // Copy to clipboard
      navigator.clipboard.writeText(textCV).then(() => {
        showSuccessToast('Đã sao chép CV vào clipboard!');
      }).catch((err) => {
        const appError = handleAPIError(err, 'copy to clipboard', 'vi');
        showErrorToast(appError, 'vi');
      });
    } catch (error) {
      console.error('Error copying text:', error);
      const appError = handleAPIError(error, 'copy text', 'vi');
      showErrorToast(appError, 'vi');
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleDownloadPDF}
        disabled={isExporting}
        className="relative bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center group"
        title="Tải xuống PDF"
      >
        {isExporting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {/* Tooltip */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {isExporting ? 'Đang tạo PDF...' : 'Tải xuống PDF'}
        </div>
      </button>
      <button
        onClick={handleCopyAsText}
        className="relative bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors duration-200 flex items-center justify-center group"
        title="Sao chép văn bản"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {/* Tooltip */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          Sao chép văn bản
        </div>
      </button>
    </div>
  );
}