"use client";

import { useState } from "react";
import { CVData } from "@/contexts/CVEditorContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

interface ExportButtonsProps {
  cvData: CVData;
}

export default function ExportButtons({ cvData }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      // Get the CV template element
      const cvElement = document.querySelector('.cv-template');
      if (!cvElement) {
        throw new Error('CV template not found');
      }

      // Create canvas from HTML element with improved settings
      const canvas = await html2canvas(cvElement as HTMLElement, {
        scale: 3, // Higher quality for better text rendering
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: cvElement.scrollWidth,
        height: cvElement.scrollHeight,
        logging: false, // Disable console logging
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return element.classList.contains('ignore-pdf');
        },
        onclone: (clonedDoc) => {
          // CSS for PDF rendering
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              color: inherit !important;
              font-family: 'Helvetica', 'Arial', sans-serif !important;
            }
            .text-blue-600 {
              color: #2563eb !important;
            }
            .text-gray-900 {
              color: #111827 !important;
            }
            .text-gray-600 {
              color: #4b5563 !important;
            }
            .text-gray-500 {
              color: #6b7280 !important;
            }
            .text-gray-700 {
              color: #374151 !important;
            }
            .bg-blue-600 {
              background-color: #2563eb !important;
            }
            .bg-gray-100 {
              background-color: #f3f4f6 !important;
            }
            .border-blue-600 {
              border-color: #2563eb !important;
            }
            .border-gray-100 {
              border-color: #f3f4f6 !important;
            }
            .border-gray-200 {
              border-color: #e5e7eb !important;
            }
            /* Ensure proper text rendering */
            h1, h2, h3, h4, h5, h6 {
              font-weight: bold !important;
              line-height: 1.2 !important;
            }
            p, li, span {
              line-height: 1.4 !important;
            }
            /* Remove any shadows or gradients that might not render well */
            * {
              box-shadow: none !important;
              text-shadow: none !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Create PDF with better settings
      const imgData = canvas.toDataURL('image/png', 0.95); // Slight compression for smaller file size
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true, // Enable compression
      });

      // Calculate dimensions with proper margins
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      const imgX = (pdfWidth - finalWidth) / 2;
      const imgY = margin;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight);

      // Download PDF with better filename
      const sanitizedTitle = (cvData.title || 'CV').replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const fileName = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      // Show success message
      toast.success('PDF đã được tạo thành công!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Có lỗi xảy ra khi tạo PDF: ${errorMessage}. Vui lòng thử lại.`);
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
        toast.success('Đã sao chép CV vào clipboard!');
      }).catch(() => {
        toast.error('Không thể sao chép vào clipboard. Vui lòng thử lại.');
      });
    } catch (error) {
      console.error('Error copying text:', error);
      toast.error('Có lỗi xảy ra khi sao chép văn bản. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex space-x-3">
      <button
        onClick={handleDownloadPDF}
        disabled={isExporting}
        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Đang tạo PDF...
          </>
        ) : (
          <>
            📄 Tải xuống PDF
          </>
        )}
      </button>
      <button
        onClick={handleCopyAsText}
        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        📋 Sao chép văn bản
      </button>
    </div>
  );
}
