"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CVPreviewCard from "./CVPreviewCard";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
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

interface DashboardContentProps {
  cvs: CV[];
}

export default function DashboardContent({ cvs }: DashboardContentProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'vi' | 'en'>('vi');
  const [cvTitle, setCvTitle] = useState("");
  const router = useRouter();

  const handleCreateCV = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/cv/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: cvTitle.trim() || `CV ${selectedLanguage.toUpperCase()}`,
          language: selectedLanguage
        }),
      });

      if (response.ok) {
        const { cvId } = await response.json();
        showSuccessToast('Đã tạo CV mới thành công!');
        router.push(`/editor/${cvId}`);
      } else {
        const appError = handleAPIError({ status: response.status }, 'create CV', 'vi');
        showErrorToast(appError, 'vi');
      }
    } catch (error) {
      console.error('Error creating CV:', error);
      const appError = handleAPIError(error, 'create CV', 'vi');
      showErrorToast(appError, 'vi');
    } finally {
      setIsCreating(false);
      setShowLanguageModal(false);
      setCvTitle("");
    }
  };

  const handleCreateCVClick = () => {
    setShowLanguageModal(true);
  };

  const handleDeleteCV = async (cvId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa CV này?')) return;

    try {
      const response = await fetch(`/api/cv/${cvId}/delete`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showSuccessToast('Đã xóa CV thành công!');
        router.refresh();
      } else {
        const appError = handleAPIError({ status: response.status }, 'delete CV', 'vi');
        showErrorToast(appError, 'vi');
      }
    } catch (error) {
      console.error('Error deleting CV:', error);
      const appError = handleAPIError(error, 'delete CV', 'vi');
      showErrorToast(appError, 'vi');
    }
  };


  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="heading-main text-3xl text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="body-text text-gray-600">
          Quản lý và tạo CV của bạn với sự hỗ trợ của AI
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={handleCreateCVClick}
          disabled={isCreating}
          className="btn-primary btn-text disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? "Đang tạo..." : "Tạo CV mới"}
        </button>
      </div>

      {cvs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📄</span>
          </div>
          <h2 className="heading-feature text-xl text-gray-900 mb-4">
            Chưa có CV nào
          </h2>
          <p className="body-text text-gray-600 mb-6 max-w-md mx-auto">
            Bắt đầu tạo CV đầu tiên của bạn với sự hỗ trợ của AI để tối ưu hóa cho hệ thống ATS.
          </p>
          <button
            onClick={handleCreateCVClick}
            disabled={isCreating}
            className="btn-primary btn-text disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Đang tạo..." : "Tạo CV đầu tiên"}
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => (
            <CVPreviewCard 
              key={cv.id} 
              cv={cv} 
              onDelete={handleDeleteCV}
            />
          ))}
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="heading-feature text-lg text-gray-900 mb-4">
              Tạo CV mới
            </h3>

            {/* Title Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Tên CV
              </label>
              <input
                type="text"
                value={cvTitle}
                onChange={(e) => setCvTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200"
                placeholder={`CV ${selectedLanguage.toUpperCase()}`}
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Chọn ngôn ngữ
              </label>
              <p className="body-text text-gray-700 mb-4">
                Tất cả nội dung CV sẽ được tạo bằng ngôn ngữ đã chọn.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {/* Vietnamese Option */}
              <div
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedLanguage === 'vi'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedLanguage('vi')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedLanguage === 'vi' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedLanguage === 'vi' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Tiếng Việt</h4>
                    <p className="text-sm text-gray-600">Tạo CV bằng tiếng Việt</p>
                  </div>
                  <div className="ml-auto text-xl font-semibold text-gray-500">VN</div>
                </div>
              </div>

              {/* English Option */}
              <div
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedLanguage === 'en'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedLanguage('en')}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedLanguage === 'en' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedLanguage === 'en' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">English</h4>
                    <p className="text-sm text-gray-600">Create CV in English</p>
                  </div>
                  <div className="ml-auto text-xl font-semibold text-gray-500">EN</div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateCV}
                disabled={isCreating}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isCreating ? "Đang tạo..." : "Tạo CV"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
