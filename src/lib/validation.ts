// Validation utilities for form inputs

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email.trim()) {
    errors.push('Email là bắt buộc');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email không hợp lệ');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone.trim()) {
    errors.push('Số điện thoại là bắt buộc');
  } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone.replace(/\s/g, ''))) {
    errors.push('Số điện thoại không hợp lệ');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!value.trim()) {
    errors.push(`${fieldName} là bắt buộc`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDateRange = (startDate: string, endDate: string): ValidationResult => {
  const errors: string[] = [];
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      errors.push('Ngày bắt đầu không thể sau ngày kết thúc');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateURL = (url: string, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (url.trim()) {
    try {
      new URL(url);
    } catch {
      errors.push(`${fieldName} không hợp lệ`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Form validation for personal info
export const validatePersonalInfo = (data: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  
  // Required fields
  const fullNameResult = validateRequired(String(data.full_name || ''), 'Họ và tên');
  errors.push(...fullNameResult.errors);
  
  const emailResult = validateEmail(String(data.email || ''));
  errors.push(...emailResult.errors);
  
  const phoneResult = validatePhone(String(data.phone || ''));
  errors.push(...phoneResult.errors);
  
  // Optional URL fields
  if (data.linkedin) {
    const linkedinResult = validateURL(String(data.linkedin), 'LinkedIn');
    errors.push(...linkedinResult.errors);
  }
  
  if (data.portfolio) {
    const portfolioResult = validateURL(String(data.portfolio), 'Portfolio');
    errors.push(...portfolioResult.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Form validation for experience
export const validateExperience = (data: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  
  // Required fields
  const companyResult = validateRequired(String(data.company || ''), 'Tên công ty');
  errors.push(...companyResult.errors);
  
  const jobTitleResult = validateRequired(String(data.job_title || ''), 'Chức vụ');
  errors.push(...jobTitleResult.errors);
  
  // Date validation
  if (data.start_date && data.end_date) {
    const dateResult = validateDateRange(String(data.start_date), String(data.end_date));
    errors.push(...dateResult.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Form validation for education
export const validateEducation = (data: Record<string, unknown>): ValidationResult => {
  const errors: string[] = [];
  
  // Required fields
  const schoolResult = validateRequired(String(data.school || ''), 'Tên trường');
  errors.push(...schoolResult.errors);
  
  const degreeResult = validateRequired(String(data.degree || ''), 'Bằng cấp');
  errors.push(...degreeResult.errors);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
