"use client";

import { useState } from "react";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { useDebounce } from "@/lib/debounce";
import ValidationMessage from "@/components/ui/ValidationMessage";

export default function EducationStep() {
  const { state, updateSection } = useCVEditor();
  
  const education = (state.cvData?.sections.education || []) as Record<string, unknown>[];
  const [dateErrors, setDateErrors] = useState<{
    [key: number]: string | null;
  }>({});

  // Debounced validation (300ms delay)
  const debouncedValidateDate = useDebounce((index: number, graduationDate: string) => {
    validateGraduationDate(index, graduationDate);
  }, 300);

  const addEducation = () => {
    const newEducation = {
      school: "",
      degree: "",
      field_of_study: "",
      graduation_date: "",
      gpa: "",
    };
    updateSection('education', [...education, newEducation]);
  };

  const removeEducation = (index: number) => {
    const updatedEducation = education.filter((_: unknown, i: number) => i !== index);
    updateSection('education', updatedEducation);
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updatedEducation = [...education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value,
    };
    updateSection('education', updatedEducation);
    
    // Debounced validation for graduation date
    if (field === 'graduation_date') {
      debouncedValidateDate(index, value);
    }
  };

  const validateGraduationDate = (index: number, graduationDate: string) => {
    if (graduationDate) {
      const year = parseInt(graduationDate, 10);
      const currentYear = new Date().getFullYear();
      
      const messages = {
        invalid: 'Năm tốt nghiệp không hợp lệ',
        future: 'Năm tốt nghiệp không thể quá xa trong tương lai',
        past: 'Năm tốt nghiệp không hợp lệ (quá xa trong quá khứ)',
      };
      
      if (isNaN(year)) {
        setDateErrors(prev => ({ ...prev, [index]: messages.invalid }));
      } else if (year < 1950) {
        setDateErrors(prev => ({ ...prev, [index]: messages.past }));
      } else if (year > currentYear + 10) {
        setDateErrors(prev => ({ ...prev, [index]: messages.future }));
      } else {
        setDateErrors(prev => ({ ...prev, [index]: null }));
      }
    } else {
      setDateErrors(prev => ({ ...prev, [index]: null }));
    }
  };

  const getStringValue = (edu: Record<string, unknown>, key: string): string => {
    const value = edu[key];
    return typeof value === 'string' ? value : '';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="heading-feature text-lg text-gray-900 mb-2">
          Học vấn
        </h3>
        <p className="body-text text-gray-600 mb-4">
          Liệt kê trình độ học vấn của bạn, bắt đầu từ trình độ cao nhất.
        </p>
      </div>

      <div className="space-y-6">
        {education.map((edu: Record<string, unknown>, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                Học vấn {index + 1}
              </h4>
              <button
                onClick={() => removeEducation(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Xóa
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên trường *
                </label>
                <input
                  type="text"
                  value={getStringValue(edu, 'school')}
                  onChange={(e) => updateEducation(index, 'school', e.target.value)}
                  placeholder="Đại học Bách Khoa Hà Nội"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bằng cấp *
                </label>
                <input
                  type="text"
                  value={getStringValue(edu, 'degree')}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  placeholder="Cử nhân"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chuyên ngành
                </label>
                <input
                  type="text"
                  value={getStringValue(edu, 'field_of_study')}
                  onChange={(e) => updateEducation(index, 'field_of_study', e.target.value)}
                  placeholder="Công nghệ thông tin"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Năm tốt nghiệp
                </label>
                <input
                  type="number"
                  value={getStringValue(edu, 'graduation_date')}
                  onChange={(e) => updateEducation(index, 'graduation_date', e.target.value)}
                  placeholder="2023"
                  min="1950"
                  max="2030"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 ${
                    dateErrors[index] ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GPA (tùy chọn)
                </label>
                <input
                  type="text"
                  value={getStringValue(edu, 'gpa')}
                  onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                  placeholder="3.5/4.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {dateErrors[index] && (
              <div className="mt-3">
                <ValidationMessage
                  type="error"
                  message={dateErrors[index]!}
                />
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addEducation}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
        >
          + Thêm học vấn
        </button>
      </div>
    </div>
  );
}

// Export validation function for use in navigation
export function validateEducationStep(education: Record<string, unknown>[], _language: 'vi' | 'en' = 'vi'): boolean {
  const currentYear = new Date().getFullYear();
  
  for (const edu of education) {
    const graduationDate = String(edu.graduation_date || '');
    
    if (graduationDate) {
      const year = parseInt(graduationDate, 10);
      
      if (isNaN(year) || year < 1950 || year > currentYear + 10) {
        return false;
      }
    }
  }
  
  return true;
}
