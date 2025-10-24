"use client";

import { useState, useEffect, useMemo } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { validatePersonalInfo } from "@/lib/validation";

export default function PersonalInfoStep() {
  const { state, updateSection } = useCVEditor();
  
  const personalInfo = useMemo(() => 
    (state.cvData?.sections.personal_info || {}) as Record<string, unknown>, 
    [state.cvData?.sections.personal_info]
  );
  const [errors, setErrors] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    const updatedInfo = {
      ...personalInfo,
      [field]: value,
    };
    
    updateSection('personal_info', updatedInfo);
    
    // Validate on change
    const validation = validatePersonalInfo(updatedInfo);
    setErrors(validation.errors);
  };

  const getStringValue = (key: string): string => {
    const value = personalInfo[key];
    return typeof value === 'string' ? value : '';
  };

  // Validate on mount
  useEffect(() => {
    const validation = validatePersonalInfo(personalInfo);
    setErrors(validation.errors);
  }, [personalInfo]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="heading-feature text-base sm:text-lg text-gray-900 mb-2">
          Thông tin cá nhân
        </h3>
        <p className="body-text text-gray-600 mb-4 text-sm sm:text-base">
          Nhập thông tin cơ bản của bạn. Đây sẽ là phần đầu tiên mà nhà tuyển dụng nhìn thấy.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-2">
            Họ và tên *
          </label>
          <input
            type="text"
            id="full-name"
            value={getStringValue('full_name')}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            placeholder="Nguyễn Văn A"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={getStringValue('email')}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="nguyenvana@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại
          </label>
          <input
            type="tel"
            id="phone"
            value={getStringValue('phone')}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="0123 456 789"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Địa chỉ
          </label>
          <input
            type="text"
            id="location"
            value={getStringValue('location')}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Hà Nội, Việt Nam"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn
          </label>
          <input
            type="url"
            id="linkedin"
            value={getStringValue('linkedin')}
            onChange={(e) => handleInputChange('linkedin', e.target.value)}
            placeholder="https://linkedin.com/in/nguyenvana"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="portfolio" className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio/Website
          </label>
          <input
            type="url"
            id="portfolio"
            value={getStringValue('portfolio')}
            onChange={(e) => handleInputChange('portfolio', e.target.value)}
            placeholder="https://nguyenvana.dev"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="shrink-0">
              <span className="text-red-600 text-base sm:text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <h4 className="text-xs sm:text-sm font-medium text-red-700 mb-2">
                Vui lòng sửa các lỗi sau:
              </h4>
              <ul className="text-xs sm:text-sm text-red-600 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
