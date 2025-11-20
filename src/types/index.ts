/**
 * Central export file for all types
 *
 * Usage:
 *   import { Database, CV, CVSection, ATSuggestion } from '@/types';
 *   import type { UserProfile, JDAnalysis } from '@/types';
 */

// Main database type (for Supabase client)
export type { Database } from "./database";

// Table types (commonly used types)
export type {
  // User
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
  // CV
  CV,
  CVInsert,
  CVUpdate,
  // CV Sections
  CVSection,
  CVSectionInsert,
  CVSectionUpdate,
  CVSectionType,
  // JD Analysis
  JDAnalysis,
  JDAnalysisInsert,
  JDAnalysisUpdate,
  // ATS Suggestions
  ATSuggestion,
  ATSuggestionInsert,
  ATSuggestionUpdate,
  // Feedback
  Feedback,
  FeedbackInsert,
  FeedbackUpdate,
  FeedbackType,
  FeedbackPriority,
  FeedbackStatus,
  // Feedback Attachments
  FeedbackAttachment,
  FeedbackAttachmentInsert,
  FeedbackAttachmentUpdate,
} from "./tables";






