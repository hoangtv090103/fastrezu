// Validation utilities for form inputs

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface CVData {
  personal_info?: {
    full_name?: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
  };
  summary?: string;
  experience?: Array<{
    company?: string;
    job_title?: string;
    description?: string;
    achievements?: string[];
    start_date?: string;
    end_date?: string;
    [key: string]: unknown;
  }>;
  education?: Array<{
    school?: string;
    degree?: string;
    field?: string;
    description?: string;
    [key: string]: unknown;
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    [key: string]: unknown;
  }>;
  skills?: string[];
  certifications?: Array<{
    name?: string;
    issuer?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @param language - Language for error messages (default: 'vi')
 * @param required - Whether email is required (default: true)
 */
export const validateEmail = (
  email: string, 
  language: 'vi' | 'en' = 'vi',
  required: boolean = true
): ValidationResult => {
  const errors: string[] = [];
  
  const messages = {
    vi: {
      required: 'Email là bắt buộc',
      invalid: 'Email không hợp lệ. Vui lòng nhập đúng định dạng (ví dụ: example@email.com)',
    },
    en: {
      required: 'Email is required',
      invalid: 'Invalid email. Please enter a valid format (e.g., example@email.com)',
    },
  };
  
  if (!email.trim()) {
    if (required) {
      errors.push(messages[language].required);
    }
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push(messages[language].invalid);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @param language - Language for error messages (default: 'vi')
 * @param required - Whether phone is required (default: true)
 */
export const validatePhone = (
  phone: string,
  language: 'vi' | 'en' = 'vi',
  required: boolean = true
): ValidationResult => {
  const errors: string[] = [];
  
  const messages = {
    vi: {
      required: 'Số điện thoại là bắt buộc',
      invalid: 'Số điện thoại không hợp lệ. Vui lòng nhập ít nhất 10 chữ số.',
    },
    en: {
      required: 'Phone number is required',
      invalid: 'Invalid phone number. Please enter at least 10 digits.',
    },
  };
  
  if (!phone.trim()) {
    if (required) {
      errors.push(messages[language].required);
    }
  } else {
    // Remove all spaces, dashes, and parentheses for validation
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    // Check if it starts with + (optional) followed by at least 10 digits
    if (!/^[\+]?[0-9]{10,}$/.test(cleanPhone)) {
      errors.push(messages[language].invalid);
    }
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

/**
 * Validate date range (start date must be before end date)
 * @param startDate - Start date string
 * @param endDate - End date string (can be 'present' or 'current')
 * @param language - Language for error messages (default: 'vi')
 */
export const validateDateRange = (
  startDate: string,
  endDate: string,
  language: 'vi' | 'en' = 'vi'
): ValidationResult => {
  const errors: string[] = [];
  
  const messages = {
    vi: {
      invalid_range: 'Ngày bắt đầu phải trước ngày kết thúc',
      invalid_start: 'Ngày bắt đầu không hợp lệ',
      invalid_end: 'Ngày kết thúc không hợp lệ',
      future_start: 'Ngày bắt đầu không thể ở tương lai',
    },
    en: {
      invalid_range: 'Start date must be before end date',
      invalid_start: 'Invalid start date',
      invalid_end: 'Invalid end date',
      future_start: 'Start date cannot be in the future',
    },
  };
  
  if (startDate && endDate) {
    // Handle 'present' or 'current' as valid end dates
    const isPresent = endDate.toLowerCase() === 'present' || endDate.toLowerCase() === 'current';
    
    const start = new Date(startDate);
    const end = isPresent ? new Date() : new Date(endDate);
    const now = new Date();
    
    // Check if dates are valid
    if (isNaN(start.getTime())) {
      errors.push(messages[language].invalid_start);
    }
    
    if (!isPresent && isNaN(end.getTime())) {
      errors.push(messages[language].invalid_end);
    }
    
    // Check if start is after end
    if (errors.length === 0 && start > end) {
      errors.push(messages[language].invalid_range);
    }
    
    // Check if start date is in the future
    if (errors.length === 0 && start > now) {
      errors.push(messages[language].future_start);
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

/**
 * Calculate total word count from CV data
 * @param cvData - CV data object
 */
export const calculateWordCount = (cvData: CVData): number => {
  let wordCount = 0;
  
  // Helper to count words in a string
  const countWords = (text: string | undefined | null): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  // Count personal info
  if (cvData.personal_info) {
    wordCount += countWords(cvData.personal_info.full_name);
    wordCount += countWords(cvData.personal_info.email);
  }
  
  // Count summary
  wordCount += countWords(cvData.summary);
  
  // Count experience
  if (cvData.experience && Array.isArray(cvData.experience)) {
    cvData.experience.forEach(exp => {
      wordCount += countWords(exp.company);
      wordCount += countWords(exp.job_title);
      wordCount += countWords(exp.description);
      if (exp.achievements && Array.isArray(exp.achievements)) {
        exp.achievements.forEach(achievement => {
          wordCount += countWords(achievement);
        });
      }
    });
  }
  
  // Count education
  if (cvData.education && Array.isArray(cvData.education)) {
    cvData.education.forEach(edu => {
      wordCount += countWords(edu.school);
      wordCount += countWords(edu.degree);
      wordCount += countWords(edu.field);
      wordCount += countWords(edu.description);
    });
  }
  
  // Count projects
  if (cvData.projects && Array.isArray(cvData.projects)) {
    cvData.projects.forEach(project => {
      wordCount += countWords(project.name);
      wordCount += countWords(project.description);
    });
  }
  
  // Count skills (each skill counts as 1 word)
  if (cvData.skills && Array.isArray(cvData.skills)) {
    wordCount += cvData.skills.length;
  }
  
  // Count certifications
  if (cvData.certifications && Array.isArray(cvData.certifications)) {
    cvData.certifications.forEach(cert => {
      wordCount += countWords(cert.name);
      wordCount += countWords(cert.issuer);
    });
  }
  
  return wordCount;
};

/**
 * Validate CV length and provide warnings
 * @param cvData - CV data object
 * @param language - Language for messages (default: 'vi')
 */
export const validateCVLength = (
  cvData: CVData,
  language: 'vi' | 'en' = 'vi'
): ValidationResult => {
  const warnings: string[] = [];
  const wordCount = calculateWordCount(cvData);
  
  const messages = {
    vi: {
      too_short: `CV của bạn có ${wordCount} từ, có vẻ ngắn. Hãy thêm chi tiết về kinh nghiệm và thành tích để tăng cơ hội được chú ý (khuyến nghị: ít nhất 200 từ).`,
      too_long: `CV của bạn có ${wordCount} từ, có vẻ dài. Hãy cân nhắc rút gọn để giữ trong 1-2 trang (khuyến nghị: tối đa 1000 từ).`,
      optimal: `CV của bạn có ${wordCount} từ, độ dài phù hợp.`,
    },
    en: {
      too_short: `Your CV has ${wordCount} words, which seems short. Add more details about your experience and achievements to increase your chances (recommended: at least 200 words).`,
      too_long: `Your CV has ${wordCount} words, which seems long. Consider condensing to keep it within 1-2 pages (recommended: maximum 1000 words).`,
      optimal: `Your CV has ${wordCount} words, which is an optimal length.`,
    },
  };
  
  if (wordCount < 200) {
    warnings.push(messages[language].too_short);
  } else if (wordCount > 1000) {
    warnings.push(messages[language].too_long);
  }
  
  return {
    isValid: true, // Length warnings don't make CV invalid
    errors: [],
    warnings
  };
};

/**
 * Validate CV data comprehensively
 * @param cvData - CV data object
 * @param language - Language for messages (default: 'vi')
 */
export const validateCV = (
  cvData: CVData,
  language: 'vi' | 'en' = 'vi'
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate personal info if present
  if (cvData.personal_info) {
    if (cvData.personal_info.email) {
      const emailResult = validateEmail(cvData.personal_info.email, language, false);
      errors.push(...emailResult.errors);
    }
    
    if (cvData.personal_info.phone) {
      const phoneResult = validatePhone(cvData.personal_info.phone, language, false);
      errors.push(...phoneResult.errors);
    }
  }
  
  // Validate experience date ranges
  if (cvData.experience && Array.isArray(cvData.experience)) {
    cvData.experience.forEach((exp, index) => {
      if (exp.start_date && exp.end_date) {
        const dateResult = validateDateRange(exp.start_date, exp.end_date, language);
        if (!dateResult.isValid) {
          const prefix = language === 'vi' 
            ? `Kinh nghiệm ${index + 1}: ` 
            : `Experience ${index + 1}: `;
          errors.push(...dateResult.errors.map(err => prefix + err));
        }
      }
    });
  }
  
  // Validate CV length
  const lengthResult = validateCVLength(cvData, language);
  if (lengthResult.warnings) {
    warnings.push(...lengthResult.warnings);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
