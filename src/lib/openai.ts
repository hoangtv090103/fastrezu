import OpenAI from 'openai';

/**
 * API Error with status code
 */
interface APIError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
  code?: string;
}

/**
 * OpenAI-compatible API Client Configuration
 *
 * Supports multiple AI providers via model tiering:
 * - 'light' tier: fast & cheap models (e.g. Gemini Flash, GPT-4o-mini) — for analysis tasks
 * - 'heavy' tier: high-quality models (e.g. Gemini Pro, GPT-4o) — for CV tailoring
 *
 * Each tier can use a different provider (different API key + base URL).
 * Fallback chain: AI_<TIER>_* → OPENAI_* → hardcoded defaults
 *
 * Features:
 * - Automatic retry with exponential backoff + jitter for transient errors (503, 429, 500, network issues)
 * - Configurable timeout and retry attempts
 * - JSON response parsing with error handling
 * - Support for both JSON and text responses
 * - Enhanced error messages for better debugging
 *
 * Default retry behavior:
 * - Max retries: 5 attempts (increased for Google Gemini API stability)
 * - Base delay: 1000ms with jitter (exponential backoff: ~1s, ~2s, ~4s, ~8s, ~16s)
 * - Default timeout: 180 seconds (3 minutes)
 *
 * Compatible with:
 * - OpenAI API (https://api.openai.com/v1)
 * - Google Gemini API (https://generativelanguage.googleapis.com/v1beta/openai)
 * - Other OpenAI-compatible APIs
 */

// Default client (backward-compatible — used when no tier is specified)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export default openai;

// ============================================================================
// Multi-Provider Model Tiering
// ============================================================================

/**
 * AI tier — 'light' for fast/cheap tasks, 'heavy' for high-quality tasks.
 *
 * Configure per-tier env vars:
 *   AI_LIGHT_API_KEY, AI_LIGHT_BASE_URL, AI_LIGHT_MODEL
 *   AI_HEAVY_API_KEY, AI_HEAVY_BASE_URL, AI_HEAVY_MODEL
 *
 * If tier-specific vars are not set, falls back to OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL.
 */
export type AITier = 'light' | 'heavy';

function createAIClient(tier: AITier): OpenAI {
  const apiKey =
    (tier === 'light' ? process.env.AI_LIGHT_API_KEY : process.env.AI_HEAVY_API_KEY)
    || process.env.OPENAI_API_KEY;
  const baseURL =
    (tier === 'light' ? process.env.AI_LIGHT_BASE_URL : process.env.AI_HEAVY_BASE_URL)
    || process.env.OPENAI_BASE_URL
    || 'https://api.openai.com/v1';
  return new OpenAI({ apiKey, baseURL });
}

let _lightClient: OpenAI | null = null;
let _heavyClient: OpenAI | null = null;

export function getAIClient(tier: AITier): OpenAI {
  if (tier === 'light') return (_lightClient ??= createAIClient('light'));
  return (_heavyClient ??= createAIClient('heavy'));
}

export function getAIModel(tier: AITier): string {
  return (
    (tier === 'light' ? process.env.AI_LIGHT_MODEL : process.env.AI_HEAVY_MODEL)
    || process.env.OPENAI_MODEL
    || (tier === 'light' ? 'gpt-4o-mini' : 'gpt-4o')
  );
}

// Helper function for retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Extract status code from error if available
      const errorObj = error as APIError;
      const statusCode = errorObj?.status || errorObj?.statusCode;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if error is retryable (503, 429, 500, network errors)
      const isRetryable = 
        statusCode === 503 ||
        statusCode === 429 ||
        statusCode === 500 ||
        errorMessage.includes('503') ||
        errorMessage.includes('429') ||
        errorMessage.includes('500') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('Service Unavailable') ||
        errorMessage.includes('Internal Server Error');
      
      // Don't retry on last attempt or if not retryable
      if (attempt === maxRetries || !isRetryable) {
        console.error(`[OpenAI] Failed after ${attempt + 1} attempts. Error:`, {
          message: errorMessage,
          status: statusCode,
          isRetryable
        });
        throw error;
      }
      
      // Exponential backoff with jitter: 1s, 2s, 4s (+ random 0-500ms)
      const baseBackoff = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 500;
      const delay = baseBackoff + jitter;
      
      console.log(`[OpenAI] Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms due to:`, {
        message: errorMessage,
        status: statusCode
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Prepend today's date to every system prompt so the model always knows the
 * current date. This prevents hallucinations like "05/2025 is a future date"
 * when the model's training cutoff predates the actual deployment date.
 */
export function injectDateContext(systemPrompt: string): string {
  const today = new Date().toISOString().split("T")[0]; // e.g. "2026-02-28"
  return `Today's date: ${today}\n\n${systemPrompt}`;
}

// Helper function để gọi OpenAI với error handling
export async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  options: {
    tier?: AITier,          // 'light' | 'heavy' — routes to the correct provider/model
    responseFormat?: 'json_object' | 'text',
    temperature?: number,
    timeout?: number,       // Timeout in milliseconds
    maxRetries?: number     // Max retry attempts for transient errors
  } = {}
) {
  const { tier, responseFormat = 'json_object', temperature = 0.3, timeout = 180000, maxRetries = 5 } = options;
  const client = tier ? getAIClient(tier) : openai;
  const model  = tier ? getAIModel(tier) : (process.env.OPENAI_MODEL || 'gpt-4o');

  return retryWithBackoff(async () => {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await client.chat.completions.create(
          {
            model,
            messages: [
              { role: "system", content: injectDateContext(systemPrompt) },
              { role: "user", content: userMessage }
            ],
            temperature,
            ...(responseFormat === 'json_object' && { response_format: { type: "json_object" } })
          },
          {
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error(`No response from AI service`);
        }

        // If using json_object format, parse directly
        if (responseFormat === 'json_object') {
          try {
            return JSON.parse(content);
          } catch (parseError) {
            console.error('JSON parse error for json_object format:', parseError);
            console.error('Raw content:', content);
            throw new Error(`Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          }
        }

        // For text format, clean and parse as before
        let cleanedContent = content.trim();
        
        // Remove markdown code blocks
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Try to find JSON object in the content
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[0];
        }

        try {
          return JSON.parse(cleanedContent);
        } catch (parseError) {
          console.error('JSON parse error for text format:', parseError);
          console.error('Raw content:', content);
          console.error('Cleaned content:', cleanedContent);
          throw new Error(`Invalid JSON response from AI: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError instanceof Error && (abortError.name === 'AbortError' || abortError.message.includes('aborted'))) {
          throw new Error('AI request timeout - response took too long');
        }
        throw abortError;
      }
    } catch (error) {
      const errorObj = error as APIError;
      const statusCode = errorObj?.status || errorObj?.statusCode;
      
      console.error('AI API error:', {
        message: error instanceof Error ? error.message : String(error),
        status: statusCode,
        type: errorObj?.type,
        code: errorObj?.code
      });
      
      // Provide more specific error messages
      if (statusCode === 503) {
        throw new Error('AI service temporarily unavailable (503). Please try again in a moment.');
      } else if (statusCode === 429) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      } else if (statusCode === 500) {
        throw new Error('AI service internal error. Please try again.');
      } else if (error instanceof Error && error.message.includes('timeout')) {
        throw error;
      }
      
      throw new Error('Failed to get AI response. Please try again.');
    }
  }, maxRetries);
}

// Helper function for text-only responses (no JSON parsing)
export async function callOpenAIText(
  systemPrompt: string,
  userMessage: string,
  options: {
    tier?: AITier,          // 'light' | 'heavy' — routes to the correct provider/model
    temperature?: number,
    maxRetries?: number,
    timeout?: number
  } = {}
) {
  const { tier, temperature = 0.3, maxRetries = 5, timeout = 180000 } = options;
  const client = tier ? getAIClient(tier) : openai;
  const model  = tier ? getAIModel(tier) : (process.env.OPENAI_MODEL || 'gpt-4o');

  return retryWithBackoff(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await client.chat.completions.create(
          {
            model,
            messages: [
              { role: "system", content: injectDateContext(systemPrompt) },
              { role: "user", content: userMessage }
            ],
            temperature,
          },
          {
            signal: controller.signal
          }
        );
        clearTimeout(timeoutId);

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error(`No response from AI service`);
        }

        return content.trim();
      } catch (abortError) {
        clearTimeout(timeoutId);
        if (abortError instanceof Error && (abortError.name === 'AbortError' || abortError.message.includes('aborted'))) {
          throw new Error('AI request timeout - response took too long');
        }
        throw abortError;
      }
    } catch (error) {
      const errorObj = error as APIError;
      const statusCode = errorObj?.status || errorObj?.statusCode;
      
      console.error('AI API error:', {
        message: error instanceof Error ? error.message : String(error),
        status: statusCode,
        type: errorObj?.type,
        code: errorObj?.code
      });
      
      // Provide more specific error messages
      if (statusCode === 503) {
        throw new Error('AI service temporarily unavailable (503). Please try again in a moment.');
      } else if (statusCode === 429) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      } else if (statusCode === 500) {
        throw new Error('AI service internal error. Please try again.');
      } else if (error instanceof Error && error.message.includes('timeout')) {
        throw error;
      }
      
      throw new Error('Failed to get AI response. Please try again.');
    }
  }, maxRetries);
}
