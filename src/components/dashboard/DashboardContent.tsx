"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface CV {
  id: string;
  title: string;
  ats_score: number;
  updated_at: string;
  created_at: string;
}

interface DashboardContentProps {
  cvs: CV[];
}

export default function DashboardContent({ cvs }: DashboardContentProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'vi' | 'en'>('vi');
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
          language: selectedLanguage
        }),
      });

      if (response.ok) {
        const { cvId } = await response.json();
        router.push(`/editor/${cvId}`);
      } else {
        console.error('Failed to create CV');
      }
    } catch (error) {
      console.error('Error creating CV:', error);
    } finally {
      setIsCreating(false);
      setShowLanguageModal(false);
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
        router.refresh();
      } else {
        console.error('Failed to delete CV');
      }
    } catch (error) {
      console.error('Error deleting CV:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
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
            <div key={cv.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <h3 className="heading-feature text-lg text-gray-900 truncate">
                  {cv.title}
                </h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(cv.ats_score)}`}>
                  {cv.ats_score}/100
                </div>
              </div>
              
              <p className="small-text text-gray-500 mb-4">
                Cập nhật lần cuối: {format(new Date(cv.updated_at), 'dd/MM/yyyy', { locale: vi })}
              </p>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/editor/${cv.id}`)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => handleDeleteCV(cv.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-600 text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="heading-feature text-lg text-gray-900 mb-4">
              Chọn ngôn ngữ cho CV
            </h3>
            <p className="body-text text-gray-600 mb-6">
              Chọn ngôn ngữ mà bạn muốn tạo CV. Tất cả nội dung CV sẽ được tạo bằng ngôn ngữ đã chọn.
            </p>

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
                  <div className="ml-auto text-xl">🇻🇳</div>
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
                  <div className="ml-auto text-xl">🇺🇸</div>
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
