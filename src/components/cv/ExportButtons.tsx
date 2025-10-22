"use client";

import { CVData } from "@/contexts/CVEditorContext";

interface ExportButtonsProps {
  cvData: CVData;
}

export default function ExportButtons({ cvData }: ExportButtonsProps) {
  const handleDownloadPDF = () => {
    // TODO: Implement PDF export
    console.log("Download PDF", cvData);
    alert("Tính năng xuất PDF sẽ được triển khai sớm!");
  };

  const handleCopyAsText = () => {
    // TODO: Implement text export
    console.log("Copy as text", cvData);
    alert("Tính năng sao chép dưới dạng văn bản sẽ được triển khai sớm!");
  };

  return (
    <div className="flex space-x-3">
      <button
        onClick={handleDownloadPDF}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Tải xuống PDF
      </button>
      <button
        onClick={handleCopyAsText}
        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Sao chép văn bản
      </button>
    </div>
  );
}
