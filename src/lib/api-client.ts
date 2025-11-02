// API client with retry logic and error handling

import { AppError, handleAPIError, isRetryableError, isRetryableStatus, logError } from './error-handler';

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  retryableStatuses?: number[];
  timeoutMs?: number; // Request timeout in milliseconds (default: 30000)
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  backoffMs: 1000, // 1 second base delay
  retryableStatuses: [429, 500, 502, 503, 504],
};

/**
 * Delay utility for exponential backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * API call with retry logic and exponential backoff
 * 
 * @param url - The URL to call
 * @param options - Fetch options
 * @param retryConfig - Retry configuration (optional)
 * @param language - Language for error messages (optional)
 * @returns Promise with the response data
 * 
 * @example
 * ```typescript
 * const data = await apiCall<{ result: string }>(
 *   '/api/ai/generate-summary',
 *   {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ text: 'example' })
 *   }
 * );
 * ```
 */
export async function apiCall<T>(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  language: 'vi' | 'en' = 'vi'
): Promise<T> {
  let lastError: Error | AppError | null = null;
  const maxAttempts = retryConfig.maxRetries + 1; // Initial attempt + retries
  
  const timeoutMs = retryConfig.timeoutMs || 30000; // Default 30s timeout
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Add timeout to fetch if not already present
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const fetchOptions: RequestInit = {
        ...options,
        signal: options.signal || controller.signal,
      };
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        throw new AppError(
          `HTTP ${response.status}: ${response.statusText}`,
          `HTTP_${response.status}`,
          errorData.error || errorData.message || response.statusText,
          isRetryableStatus(response.status),
          { status: response.status, url, attempt }
        );
      }
      
      // Parse and return response
      const data = await response.json();
      return data as T;
      
    } catch (error) {
      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new AppError(
          'Request timeout',
          'TIMEOUT_ERROR',
          language === 'vi' 
            ? 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.'
            : 'Request took too long. Please try again.',
          true,
          { url, attempt }
        );
      } else {
        lastError = handleAPIError(error, `API call to ${url}`, language);
      }
      
      // Log the error
      logError(lastError, { attempt, url });
      
      // Check if we should retry
      const shouldRetry = attempt < retryConfig.maxRetries && 
                         (isRetryableError(lastError) || 
                          (lastError instanceof AppError && lastError.retryable));
      
      if (shouldRetry) {
        // Calculate exponential backoff delay
        const delayMs = retryConfig.backoffMs * Math.pow(2, attempt);
        console.log(`[API Client] Retrying in ${delayMs}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
        await delay(delayMs);
        continue;
      }
      
      // No more retries, throw the error
      break;
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

/**
 * Simplified API call for GET requests
 */
export async function apiGet<T>(
  url: string,
  retryConfig?: RetryConfig,
  language?: 'vi' | 'en'
): Promise<T> {
  return apiCall<T>(url, { method: 'GET' }, retryConfig, language);
}

/**
 * Simplified API call for POST requests
 */
export async function apiPost<T>(
  url: string,
  body: unknown,
  retryConfig?: RetryConfig,
  language?: 'vi' | 'en'
): Promise<T> {
  return apiCall<T>(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    retryConfig,
    language
  );
}

/**
 * Simplified API call for PUT requests
 */
export async function apiPut<T>(
  url: string,
  body: unknown,
  retryConfig?: RetryConfig,
  language?: 'vi' | 'en'
): Promise<T> {
  return apiCall<T>(
    url,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    retryConfig,
    language
  );
}

/**
 * Simplified API call for DELETE requests
 */
export async function apiDelete<T>(
  url: string,
  retryConfig?: RetryConfig,
  language?: 'vi' | 'en'
): Promise<T> {
  return apiCall<T>(url, { method: 'DELETE' }, retryConfig, language);
}

/**
 * POST helper for FormData bodies (e.g., file uploads). Do not set Content-Type explicitly.
 */
export async function apiPostFormData<T>(
  url: string,
  formData: FormData,
  retryConfig?: RetryConfig,
  language?: 'vi' | 'en'
): Promise<T> {
  return apiCall<T>(
    url,
    {
      method: 'POST',
      body: formData,
    },
    retryConfig,
    language
  );
}

/**
 * Low-level POST that returns the raw Response (useful for blobs/headers)
 */
export async function apiPostRaw(
  url: string,
  body: unknown,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  language: 'vi' | 'en' = 'vi'
): Promise<Response> {
  let lastError: Error | AppError | null = null;
  const maxAttempts = retryConfig.maxRetries + 1;
  const timeoutMs = retryConfig.timeoutMs || 30000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

      const response = await fetch(url, {
        method: 'POST',
        headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
        body: isFormData ? (body as FormData) : JSON.stringify(body ?? {}),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error JSON, else plain text
        let errorPayload: unknown = {};
        try {
          errorPayload = await response.clone().json();
        } catch {
          try {
            errorPayload = { message: await response.clone().text() };
          } catch {
            errorPayload = {};
          }
        }

        let serverMessage: string | undefined;
        if (typeof errorPayload === 'object' && errorPayload !== null) {
          const ep = errorPayload as { error?: unknown; message?: unknown };
          serverMessage = typeof ep.error === 'string'
            ? ep.error
            : (typeof ep.message === 'string' ? ep.message : undefined);
        }

        throw new AppError(
          `HTTP ${response.status}: ${response.statusText}`,
          `HTTP_${response.status}`,
          serverMessage || response.statusText,
          isRetryableStatus(response.status),
          { status: response.status, url, attempt }
        );
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new AppError(
          'Request timeout',
          'TIMEOUT_ERROR',
          language === 'vi'
            ? 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.'
            : 'Request took too long. Please try again.',
          true,
          { url, attempt }
        );
      } else {
        lastError = handleAPIError(error, `API call to ${url}`, language);
      }

      logError(lastError, { attempt, url });

      const shouldRetry = attempt < retryConfig.maxRetries &&
        (isRetryableError(lastError) || (lastError instanceof AppError && lastError.retryable));

      if (shouldRetry) {
        const delayMs = retryConfig.backoffMs * Math.pow(2, attempt);
        console.log(`[API Client] Retrying in ${delayMs}ms (attempt ${attempt + 1}/${retryConfig.maxRetries})`);
        await (new Promise(res => setTimeout(res, delayMs)));
        continue;
      }
      break;
    }
  }

  throw lastError;
}
