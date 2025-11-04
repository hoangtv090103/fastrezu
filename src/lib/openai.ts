import OpenAI from 'openai';

/**
 * OpenAI API Client Configuration
 * 
 * Features:
 * - Automatic retry with exponential backoff for transient errors (503, 429, network issues)
 * - Configurable timeout and retry attempts
 * - JSON response parsing with error handling
 * - Support for both JSON and text responses
 * 
 * Default retry behavior:
 * - Max retries: 3 attempts
 * - Base delay: 1000ms (exponential backoff: 1s, 2s, 4s)
 * - Default timeout: 120 seconds
 */

// Cấu hình OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1', // Có thể dùng proxy hoặc custom endpoint
});

export default openai;

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
      
      // Check if error is retryable (503, 429, network errors)
      const isRetryable = 
        error instanceof Error && (
          error.message.includes('503') ||
          error.message.includes('429') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('network')
        );
      
      // Don't retry on last attempt or if not retryable
      if (attempt === maxRetries || !isRetryable) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[OpenAI] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms due to:`, error instanceof Error ? error.message : error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Helper function để gọi OpenAI với error handling
export async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  options: { 
    responseFormat?: 'json_object' | 'text',
    temperature?: number,
    timeout?: number, // Timeout in milliseconds
    maxRetries?: number // Max retry attempts for transient errors
  } = {}
) {
  const { responseFormat = 'json_object', temperature = 0.3, timeout = 120000, maxRetries = 3 } = options;
  
  return retryWithBackoff(async () => {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await openai.chat.completions.create(
          {
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [
              { role: "system", content: systemPrompt },
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
      console.error('AI API error:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        throw error;
      }
      throw new Error('Failed to get AI response');
    }
  }, maxRetries);
}

// Helper function for text-only responses (no JSON parsing)
export async function callOpenAIText(
  systemPrompt: string,
  userMessage: string,
  options: {
    temperature?: number,
    maxRetries?: number
  } = {}
) {
  const { temperature = 0.3, maxRetries = 3 } = options;
  
  return retryWithBackoff(async () => {
    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error(`No response from AI service`);
      }

      return content.trim();
    } catch (error) {
      console.error('AI API error:', error);
      throw new Error('Failed to get AI response');
    }
  }, maxRetries);
}
