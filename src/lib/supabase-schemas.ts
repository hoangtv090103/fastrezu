/**
 * Reusable Zod schemas for Supabase query responses
 * 
 * This file contains schemas for common Supabase query patterns, including:
 * - Response structures with data and error
 * - Commonly queried table subsets
 * - Helper types for type-safe database queries
 */

import { z } from 'zod';
import type { ATSuggestion } from '@/types';

// ============================================================================
// Generic Supabase Response Schemas
// ============================================================================

/**
 * Generic Supabase error schema
 */
export const supabaseErrorSchema = z.object({
  message: z.string(),
  details: z.string().optional(),
  hint: z.string().optional(),
  code: z.string().optional(),
}).nullable();

/**
 * Generic Supabase response wrapper
 * Use this to create type-safe response types for any query
 */
export function createSupabaseResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema.nullable(),
    error: supabaseErrorSchema,
  });
}

// ============================================================================
// CV Table Schemas
// ============================================================================

/**
 * Minimal CV schema - for ownership checks and basic info
 */
export const cvMinimalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  language: z.enum(['vi', 'en']),
});

/**
 * CV with basic fields - most common query pattern
 */
export const cvBasicSchema = cvMinimalSchema.extend({
  title: z.string(),
  is_active: z.boolean(),
  ats_score: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// ============================================================================
// ATS Suggestions Schemas
// ============================================================================

/**
 * ATS Suggestion schema based on the ATSuggestion type
 */
export const atsSuggestionSchema = z.object({
  id: z.string().uuid(),
  cv_id: z.string().uuid(),
  suggestion_id: z.string(),
  suggestion_text: z.string(),
  suggestion_type: z.string(),
  target_section: z.string(),
  target_index: z.number().nullable(),
  keyword: z.string().nullable().optional(),
  priority: z.string(),
  original_content: z.unknown().optional(),
  suggested_content: z.unknown().optional(),
  is_active: z.boolean(),
  is_applied: z.boolean(),
  created_at: z.string(),
  applied_at: z.string().nullable().optional(),
});

/**
 * Array of ATS suggestions
 */
export const atsSuggestionsArraySchema = z.array(atsSuggestionSchema);

// ============================================================================
// JD Analysis Schemas
// ============================================================================

/**
 * JD Analysis minimal schema
 */
export const jdAnalysisMinimalSchema = z.object({
  id: z.string().uuid(),
  cv_id: z.string().uuid(),
  jd_text: z.string(),
  keywords_extracted: z.array(z.string()),
});

/**
 * JD Analysis full schema
 */
export const jdAnalysisSchema = jdAnalysisMinimalSchema.extend({
  analysis_result: z.record(z.string(), z.unknown()),
  created_at: z.string(),
});

// ============================================================================
// Supabase Response Types (for Promise.all patterns)
// ============================================================================

/**
 * Response type for CV minimal query
 */
export const cvMinimalResponseSchema = createSupabaseResponseSchema(cvMinimalSchema);

/**
 * Response type for CV basic query
 */
export const cvBasicResponseSchema = createSupabaseResponseSchema(cvBasicSchema);

/**
 * Response type for ATS suggestions array query
 */
export const atsSuggestionsResponseSchema = createSupabaseResponseSchema(atsSuggestionsArraySchema);

/**
 * Response type for JD analysis query
 */
export const jdAnalysisResponseSchema = createSupabaseResponseSchema(jdAnalysisSchema);

// ============================================================================
// Type Exports
// ============================================================================

export type SupabaseError = z.infer<typeof supabaseErrorSchema>;
export type CVMinimal = z.infer<typeof cvMinimalSchema>;
export type CVBasic = z.infer<typeof cvBasicSchema>;
export type ATSuggestionData = z.infer<typeof atsSuggestionSchema>;
export type JDAnalysisMinimal = z.infer<typeof jdAnalysisMinimalSchema>;
export type JDAnalysis = z.infer<typeof jdAnalysisSchema>;

/**
 * Generic Supabase response type
 */
export type SupabaseResponse<T> = {
  data: T | null;
  error: SupabaseError;
};

/**
 * Type-safe response types for common queries
 */
export type CVMinimalResponse = z.infer<typeof cvMinimalResponseSchema>;
export type CVBasicResponse = z.infer<typeof cvBasicResponseSchema>;
export type ATSuggestionsResponse = z.infer<typeof atsSuggestionsResponseSchema>;
export type JDAnalysisResponse = z.infer<typeof jdAnalysisResponseSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates a Supabase response against a schema
 * Useful for runtime type checking of database responses
 */
export function validateSupabaseResponse<T extends z.ZodTypeAny>(
  schema: T,
  response: unknown
): z.infer<T> {
  return schema.parse(response);
}

/**
 * Safely validates a Supabase response, returning success/error object
 */
export function safeValidateSupabaseResponse<T extends z.ZodTypeAny>(
  schema: T,
  response: unknown
) {
  const result = schema.safeParse(response);
  
  if (!result.success) {
    return {
      success: false as const,
      error: result.error.format(),
    };
  }
  
  return {
    success: true as const,
    data: result.data as z.infer<T>,
  };
}
