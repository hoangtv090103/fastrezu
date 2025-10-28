"use client";

import { useState, useEffect, useMemo } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { validateEmail, validatePhone } from "@/lib/validation";
import ValidationMessage from "@/components/ui/ValidationMessage";

export default function PersonalInfoStep() {
  const { state, updateSection } = useCVEditor();
  
  const personalInfo = useMemo(() => 
    (state.cvData?.sections.personal_info || {}) as Record<string, unknown>, 
    [state.cvData?.sections.personal_info]
  );
  
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const language = state.cvData?.language || 'vi';

  const handleInputChange = (field: string, value: string) => {
    const updatedInfo = {
      ...personalInfo,
      [field]: value,
    };
    
    updateSection('personal_info', updatedInfo);
    
    // Real-time validation for touched fields
    if (touchedFields.has(field)) {
      validateField(field, value);
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    validateField(field, value);
  };

  const validateField = (field: string, value: string) => {
    if (field === 'email') {
      const result = validateEmail(value, language, false);
      setEmailError(result.errors.length > 0 ? result.errors[0] : null);
    } else if (field === 'phone') {
      // Phone is optional, only validate if provided
      if (value.trim()) {
        const result = validatePhone(value, language, false);
        setPhoneError(result.errors.length > 0 ? result.errors[0] : null);
      } else {
        setPhoneError(null);
      }
    }
  };

  const getStringValue = (key: string): string => {
    const value = personalInfo[key];
    return typeof value === 'string' ? value : '';
  };

  // Validate on mount for existing data
  useEffect(() => {
    const email = getStringValue('email');
    const phone = getStringValue('phone');
    
    if (email) {
      const result = validateEmail(email, language, false);
      setEmailError(result.errors.length > 0 ? result.errors[0] : null);
    }
    
    if (phone) {
      const result = validatePhone(phone, language, false);
      setPhoneError(result.errors.length > 0 ? result.errors[0] : null);
    }
  }, [language]);

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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
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
            onBlur={(e) => handleBlur('email', e.target.value)}
            placeholder="nguyenvana@email.com"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 ${
              emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
            required
          />
          {emailError && (
            <ValidationMessage
              type="error"
              message={emailError}
            />
          )}
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
            onBlur={(e) => handleBlur('phone', e.target.value)}
            placeholder="0123 456 789"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 ${
              phoneError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {phoneError && (
            <ValidationMessage
              type="error"
              message={phoneError}
            />
          )}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

    </div>
  );
}

// Export validation function for use in navigation
export function validatePersonalInfoStep(personalInfo: Record<string, unknown>, language: 'vi' | 'en' = 'vi'): boolean {
  const email = String(personalInfo.email || '');
  const phone = String(personalInfo.phone || '');
  
  // Email validation
  const emailResult = validateEmail(email, language, false);
  if (emailResult.errors.length > 0) {
    return false;
  }
  
  // Phone validation (only if provided)
  if (phone.trim()) {
    const phoneResult = validatePhone(phone, language, false);
    if (phoneResult.errors.length > 0) {
      return false;
    }
  }
  
  return true;
}
