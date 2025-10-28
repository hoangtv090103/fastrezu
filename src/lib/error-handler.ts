// Error handling utilities for the application

/**
 * Custom application error class with user-friendly messages
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public retryable: boolean = false,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error message constants for Vietnamese and English
 */
export const ERROR_MESSAGES = {
  vi: {
    // Network errors
    network_error: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.',
    timeout_error: 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.',
    
    // AI service errors
    ai_service_unavailable: 'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau vài phút.',
    ai_rate_limit: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi một chút và thử lại.',
    ai_generation_failed: 'Không thể tạo nội dung AI. Vui lòng thử lại hoặc nhập thủ công.',
    
    // PDF export errors
    pdf_export_failed: 'Không thể tạo PDF. Bạn có thể thử sao chép nội dung dưới dạng văn bản.',
    pdf_generation_timeout: 'Tạo PDF mất quá nhiều thời gian. Vui lòng thử lại.',
    
    // Validation errors
    validation_error: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
    invalid_email: 'Email không hợp lệ. Vui lòng nhập đúng định dạng.',
    invalid_phone: 'Số điện thoại không hợp lệ.',
    invalid_date_range: 'Ngày bắt đầu phải trước ngày kết thúc.',
    required_field: 'Vui lòng điền đầy đủ các trường bắt buộc.',
    
    // Database errors
    database_error: 'Lỗi khi lưu dữ liệu. Vui lòng thử lại.',
    not_found: 'Không tìm thấy dữ liệu yêu cầu.',
    
    // Authentication errors
    unauthorized: 'Bạn cần đăng nhập để thực hiện thao tác này.',
    forbidden: 'Bạn không có quyền thực hiện thao tác này.',
    
    // Generic errors
    unknown_error: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
    server_error: 'Lỗi server. Vui lòng thử lại sau.',
  },
  en: {
    // Network errors
    network_error: 'Unable to connect to server. Please check your internet connection and try again.',
    timeout_error: 'Request took too long. Please try again.',
    
    // AI service errors
    ai_service_unavailable: 'AI service is temporarily unavailable. Please try again in a few minutes.',
    ai_rate_limit: 'You have sent too many requests. Please wait a moment and try again.',
    ai_generation_failed: 'Unable to generate AI content. Please try again or enter manually.',
    
    // PDF export errors
    pdf_export_failed: 'Unable to create PDF. You can try copying the content as text.',
    pdf_generation_timeout: 'PDF generation took too long. Please try again.',
    
    // Validation errors
    validation_error: 'Invalid data. Please check your information.',
    invalid_email: 'Invalid email. Please enter a valid format.',
    invalid_phone: 'Invalid phone number.',
    invalid_date_range: 'Start date must be before end date.',
    required_field: 'Please fill in all required fields.',
    
    // Database errors
    database_error: 'Error saving data. Please try again.',
    not_found: 'Requested data not found.',
    
    // Authentication errors
    unauthorized: 'You need to log in to perform this action.',
    forbidden: 'You do not have permission to perform this action.',
    
    // Generic errors
    unknown_error: 'An unknown error occurred. Please try again or contact support.',
    server_error: 'Server error. Please try again later.',
  },
};

/**
 * Error code mapping to message keys
 */
const ERROR_CODE_MAP: Record<string, keyof typeof ERROR_MESSAGES.vi> = {
  // Network
  'NETWORK_ERROR': 'network_error',
  'TIMEOUT_ERROR': 'timeout_error',
  'ECONNREFUSED': 'network_error',
  'ENOTFOUND': 'network_error',
  'ETIMEDOUT': 'timeout_error',
  
  // AI
  'AI_SERVICE_UNAVAILABLE': 'ai_service_unavailable',
  'AI_RATE_LIMIT': 'ai_rate_limit',
  'AI_GENERATION_FAILED': 'ai_generation_failed',
  
  // PDF
  'PDF_EXPORT_FAILED': 'pdf_export_failed',
  'PDF_GENERATION_TIMEOUT': 'pdf_generation_timeout',
  
  // Validation
  'VALIDATION_ERROR': 'validation_error',
  'INVALID_EMAIL': 'invalid_email',
  'INVALID_PHONE': 'invalid_phone',
  'INVALID_DATE_RANGE': 'invalid_date_range',
  'REQUIRED_FIELD': 'required_field',
  
  // Database
  'DATABASE_ERROR': 'database_error',
  'NOT_FOUND': 'not_found',
  
  // Auth
  'UNAUTHORIZED': 'unauthorized',
  'FORBIDDEN': 'forbidden',
  
  // Generic
  'UNKNOWN_ERROR': 'unknown_error',
  'SERVER_ERROR': 'server_error',
};

/**
 * HTTP status code to error code mapping
 */
const HTTP_STATUS_MAP: Record<number, keyof typeof ERROR_MESSAGES.vi> = {
  400: 'validation_error',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  429: 'ai_rate_limit',
  500: 'server_error',
  502: 'server_error',
  503: 'ai_service_unavailable',
  504: 'timeout_error',
};

/**
 * Determine if an error is retryable based on its characteristics
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.retryable;
  }
  
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Check for specific error codes
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'NETWORK_ERROR'].includes(code);
  }
  
  return false;
}

/**
 * Determine if an HTTP status code is retryable
 */
export function isRetryableStatus(status: number): boolean {
  // 5xx errors are retryable (server errors)
  if (status >= 500 && status < 600) {
    return true;
  }
  
  // 429 (rate limit) is retryable
  if (status === 429) {
    return true;
  }
  
  return false;
}

/**
 * Get user-friendly error message based on error code and language
 */
export function getErrorMessage(
  code: string,
  language: 'vi' | 'en' = 'vi'
): string {
  const messageKey = ERROR_CODE_MAP[code] || 'unknown_error';
  return ERROR_MESSAGES[language][messageKey];
}

/**
 * Get user-friendly error message based on HTTP status code
 */
export function getErrorMessageFromStatus(
  status: number,
  language: 'vi' | 'en' = 'vi'
): string {
  const messageKey = HTTP_STATUS_MAP[status] || 'unknown_error';
  return ERROR_MESSAGES[language][messageKey];
}

/**
 * Handle API errors and convert them to AppError instances
 */
export function handleAPIError(
  error: unknown,
  context: string,
  language: 'vi' | 'en' = 'vi'
): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }
  
  // HTTP Response error
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    const retryable = isRetryableStatus(status);
    const userMessage = getErrorMessageFromStatus(status, language);
    
    return new AppError(
      `HTTP ${status} error in ${context}`,
      `HTTP_${status}`,
      userMessage,
      retryable,
      { status, context }
    );
  }
  
  // Network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      `Network error in ${context}: ${error.message}`,
      'NETWORK_ERROR',
      ERROR_MESSAGES[language].network_error,
      true,
      { context }
    );
  }
  
  // Error with code property
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    const retryable = isRetryableError(error);
    const userMessage = getErrorMessage(code, language);
    
    return new AppError(
      `Error in ${context}: ${code}`,
      code,
      userMessage,
      retryable,
      { context }
    );
  }
  
  // Generic error
  const message = error instanceof Error ? error.message : String(error);
  return new AppError(
    `Unknown error in ${context}: ${message}`,
    'UNKNOWN_ERROR',
    ERROR_MESSAGES[language].unknown_error,
    false,
    { context, originalError: message }
  );
}

/**
 * Log error for monitoring (can be extended to send to error tracking service)
 */
export function logError(error: AppError | Error, additionalContext?: Record<string, unknown>): void {
  console.error('[Error]', {
    name: error.name,
    message: error.message,
    ...(error instanceof AppError && {
      code: error.code,
      userMessage: error.userMessage,
      retryable: error.retryable,
      context: error.context,
    }),
    ...additionalContext,
    timestamp: new Date().toISOString(),
  });
}
