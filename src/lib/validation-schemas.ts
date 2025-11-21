/**
 * Centralized Zod validation schemas for API routes
 * 
 * This file contains all validation schemas used across the application.
 * Benefits:
 * - Type-safe validation
 * - Consistent error messages
 * - Reusable schemas
 * - Easy to maintain and extend
 */

import { z } from 'zod';

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Language enum - supports Vietnamese and English
 */
export const languageSchema = z.enum(['vi', 'en']).default('vi');

/**
 * CV ID - must be a valid UUID
 */
export const cvIdSchema = z.string().uuid({ message: 'Invalid CV ID format' });

/**
 * User ID - must be a valid UUID
 */
export const userIdSchema = z.string().uuid({ message: 'Invalid user ID format' });

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// ============================================================================
// CV Related Schemas
// ============================================================================

/**
 * Schema for creating a new CV
 */
export const createCVSchema = z.object({
  title: z.string().max(100, 'Title must be less than 100 characters').optional(),
  language: languageSchema,
});

/**
 * Schema for updating a CV
 */
export const updateCVSchema = z.object({
  title: z.string().max(100, 'Title must be less than 100 characters').optional(),
  ats_score: z.number().min(0).max(100).optional(),
  is_active: z.boolean().optional(),
});

/**
 * Schema for CV section types
 */
export const sectionTypeSchema = z.enum([
  'personal_info',
  'summary',
  'experience',
  'education',
  'skills',
  'certifications',
  'languages',
  'projects',
]);

/**
 * Schema for applying a suggestion
 */
export const applySuggestionSchema = z.object({
  cvId: cvIdSchema,
  suggestionId: z.string().min(1, 'Suggestion ID is required'),
});

/**
 * Schema for applying all suggestions
 */
export const applyAllSuggestionsSchema = z.object({
  cvId: cvIdSchema,
});

/**
 * Schema for saving suggestions
 */
export const saveSuggestionsSchema = z.object({
  cvId: cvIdSchema,
  suggestions: z.array(z.object({
    suggestion_id: z.string(),
    issue_type: z.enum(['missing', 'weak', 'format', 'keyword']),
    severity: z.enum(['high', 'medium', 'low']),
    target_section: z.string(),
    target_field: z.string().optional(),
    target_index: z.number().nullable().optional(),
    current_value: z.string().optional(),
    suggested_value: z.string(),
    explanation: z.string(),
    keywords: z.array(z.string()).optional(),
  })),
});

// ============================================================================
// AI/OpenAI Related Schemas
// ============================================================================

/**
 * Schema for generating summary
 */
export const generateSummarySchema = z.object({
  personalInfo: z.object({
    full_name: z.string().min(1, 'Full name is required'),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  experience: z.array(z.unknown()).optional(),
  jdKeywords: z.array(z.string()).optional(),
  language: languageSchema,
  cvId: cvIdSchema.optional(),
});

/**
 * Schema for deleting CV (cvId from params)
 */
export const deleteCVSchema = z.object({
  cvId: cvIdSchema,
});

/**
 * Schema for writing experience
 */
export const writeExperienceSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  company: z.string().optional(),
  jdKeywords: z.array(z.string()),
  experienceLevel: z.string().optional(),
  currentDescription: z.string().optional(),
  language: languageSchema,
  mode: z.enum(['real', 'shadow']).optional().default('real'),
});

/**
 * Schema for analyzing job description
 */
export const analyzeJDSchema = z.object({
  jdText: z.string().min(10, 'Job description must be at least 10 characters'),
  cvId: cvIdSchema,
  language: languageSchema,
});

/**
 * Schema for scoring CV
 */
export const scoreCVSchema = z.object({
  cvContent: z.string().min(1, 'CV content is required'),
  jdText: z.string().min(1, 'Job description is required'),
  language: languageSchema,
});

/**
 * Schema for extracting skills
 */
export const extractSkillsSchema = z.object({
  jdText: z.string().min(10, 'Job description must be at least 10 characters'),
  language: languageSchema,
});

/**
 * Schema for improving bullet point
 */
export const improveBulletSchema = z.object({
  bulletPoint: z.string().min(1, 'Bullet point is required'),
  context: z.record(z.string(), z.unknown()).optional(),
  jdKeywords: z.array(z.string()).optional(),
  language: languageSchema,
  mode: z.enum(['real', 'shadow']).optional().default('real'),
});

/**
 * Schema for scoring uploaded CV
 */
export const scoreUploadedCVSchema = z.object({
  confirmedText: z.string().min(10, 'Confirmed text must be at least 10 characters'),
  jdText: z.string().optional(),
  language: languageSchema,
});

/**
 * Schema for generating Shadow JD (Generic Mode)
 */
export const generateShadowJDSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200, 'Job title must be less than 200 characters'),
  level: z.enum(['intern', 'fresher', 'junior', 'midLevel', 'senior', 'manager'], {
    message: 'Experience level must be one of: intern, fresher, junior, midLevel, senior, manager'
  }),
  cvId: cvIdSchema,
  language: languageSchema,
});



/**
 * Schema for JD list query parameters
 */
export const jdListQuerySchema = z.object({
  cvId: cvIdSchema,
});

/**
 * Schema for JD delete query parameters
 */
export const jdDeleteQuerySchema = z.object({
  jdId: z.string().uuid({ message: 'Invalid JD ID format' }),
});

/**
 * Schema for scoring CV with data
 */
export const scoreCVWithDataSchema = z.object({
  cvData: z.object({
    id: z.string().optional(),
    sections: z.record(z.string(), z.unknown()).optional(),
  }),
  jdKeywords: z.array(z.string()).optional(),
  language: languageSchema,
  mode: z.enum(['real', 'shadow']).optional().default('real'),
});

// ============================================================================
// Feedback Related Schemas
// ============================================================================

/**
 * Feedback type enum
 */
export const feedbackTypeSchema = z.enum([
  'bug_report',
  'feature_request',
  'general_feedback',
  'praise',
]);

/**
 * Feedback priority enum
 */
export const feedbackPrioritySchema = z.enum(['low', 'medium', 'high']);

/**
 * Schema for submitting feedback
 */
export const submitFeedbackSchema = z.object({
  feedback_type: feedbackTypeSchema,
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200, 'Subject must be less than 200 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message must be less than 5000 characters'),
  user_email: z.string().email('Invalid email format').optional().or(z.literal('')),
  priority: feedbackPrioritySchema.default('medium'),
  attachments: z.array(z.object({
    file_name: z.string(),
    original_name: z.string(),
    file_type: z.string(),
    file_size: z.number().positive(),
    file_path: z.string(),
  })).optional(),
});

// ============================================================================
// Job Description Related Schemas
// ============================================================================

/**
 * Schema for creating/saving a job description
 */
export const saveJDSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  company: z.string().max(200, 'Company name must be less than 200 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  language: languageSchema,
});

/**
 * Schema for deactivating suggestions
 */
export const deactivateSuggestionsSchema = z.object({
  cvId: cvIdSchema,
});

/**
 * Schema for getting suggestions
 */
export const getSuggestionsSchema = z.object({
  cvId: cvIdSchema,
});

/**
 * Schema for CV file upload
 */
export const cvFileUploadSchema = z.object({
  file: z.any(), // FormData File object
});

/**
 * Schema for feedback file upload
 */
export const feedbackFileUploadSchema = z.object({
  file: z.any(), // FormData File object
});

/**
 * Schema for suggesting improvements
 */
export const suggestImprovementsSchema = z.object({
  suggestions: z.array(z.object({
    id: z.string(),
    keyword: z.string(),
    targetSection: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
  cvData: z.object({
    sections: z.record(z.string(), z.unknown()),
    language: languageSchema.optional(),
  }),
});

// ============================================================================
// File Upload Related Schemas
// ============================================================================

/**
 * Schema for file upload constraints
 */
export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024, // 10MB
    'File size must be less than 10MB'
  ).refine(
    (file) => ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'].includes(file.type),
    'File must be PDF or Word document'
  ),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates request body against a schema and returns formatted errors
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success flag and either data or formatted errors
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.format(),
      firstError: result.error.issues[0]?.message || 'Validation error',
    };
  }
  
  return {
    success: true as const,
    data: result.data,
  };
}

/**
 * Validates CV file upload (PDF/DOCX, max 10MB)
 * 
 * @param file - File from FormData
 * @returns Object with success flag and either file or error message
 */
export function validateCVFileUpload(file: File | null) {
  if (!file) {
    return {
      success: false as const,
      error: 'No file provided',
    };
  }

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false as const,
      error: 'Only PDF and DOCX files are allowed',
    };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      success: false as const,
      error: 'File size must be less than 10MB',
    };
  }

  return {
    success: true as const,
    file,
  };
}

/**
 * Validates feedback image file upload (JPG/PNG/GIF/WebP, max 5MB)
 * 
 * @param file - File from FormData
 * @returns Object with success flag and either file or error message
 */
export function validateFeedbackImageUpload(file: File | null) {
  if (!file) {
    return {
      success: false as const,
      error: 'No file provided',
    };
  }

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false as const,
      error: 'Only image files are allowed (JPEG, PNG, GIF, WebP). Maximum size: 5MB',
    };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      success: false as const,
      error: 'File size must be less than 5MB',
    };
  }

  return {
    success: true as const,
    file,
  };
}

/**
 * Express/Next.js middleware wrapper for schema validation
 * Returns a properly formatted error response if validation fails
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or throws with formatted error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = validateSchema(schema, data);
  
  if (!result.success) {
    throw new Error(result.firstError);
  }
  
  return result.data;
}

// ============================================================================
// Type Exports (for use in components/API routes)
// ============================================================================

export type CreateCVInput = z.infer<typeof createCVSchema>;
export type UpdateCVInput = z.infer<typeof updateCVSchema>;
export type ApplySuggestionInput = z.infer<typeof applySuggestionSchema>;
export type ApplyAllSuggestionsInput = z.infer<typeof applyAllSuggestionsSchema>;
export type SaveSuggestionsInput = z.infer<typeof saveSuggestionsSchema>;
export type GenerateSummaryInput = z.infer<typeof generateSummarySchema>;
export type WriteExperienceInput = z.infer<typeof writeExperienceSchema>;
export type AnalyzeJDInput = z.infer<typeof analyzeJDSchema>;
export type ScoreCVInput = z.infer<typeof scoreCVSchema>;
export type ScoreCVWithDataInput = z.infer<typeof scoreCVWithDataSchema>;
export type ScoreUploadedCVInput = z.infer<typeof scoreUploadedCVSchema>;
export type ExtractSkillsInput = z.infer<typeof extractSkillsSchema>;
export type ImproveBulletInput = z.infer<typeof improveBulletSchema>;
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type SaveJDInput = z.infer<typeof saveJDSchema>;
export type JDListQueryInput = z.infer<typeof jdListQuerySchema>;
export type JDDeleteQueryInput = z.infer<typeof jdDeleteQuerySchema>;
export type GenerateShadowJDInput = z.infer<typeof generateShadowJDSchema>;
