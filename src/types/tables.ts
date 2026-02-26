/**
 * Helper types for database tables
 * These types make it easier to import and use table types throughout the codebase
 */

import type { Database } from './database';

// Helper type to extract table types
type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// ========================================
// User Profiles
// ========================================
export type UserProfile = TableRow<'user_profiles'>;
export type UserProfileInsert = TableInsert<'user_profiles'>;
export type UserProfileUpdate = TableUpdate<'user_profiles'>;

// ========================================
// CVs
// ========================================
export type CV = TableRow<'cvs'>;
export type CVInsert = TableInsert<'cvs'>;
export type CVUpdate = TableUpdate<'cvs'>;

// ========================================
// CV Sections
// ========================================
export type CVSection = TableRow<'cv_sections'>;
export type CVSectionInsert = TableInsert<'cv_sections'>;
export type CVSectionUpdate = TableUpdate<'cv_sections'>;

export type CVSectionType = CVSection['section_type'];

// ========================================
// JD Analyses
// ========================================
export type JDAnalysis = TableRow<'jd_analyses'>;
export type JDAnalysisInsert = TableInsert<'jd_analyses'>;
export type JDAnalysisUpdate = TableUpdate<'jd_analyses'>;

// ========================================
// ATS Suggestions
// ========================================
export type ATSuggestion = TableRow<'ats_suggestions'>;
export type ATSuggestionInsert = TableInsert<'ats_suggestions'>;
export type ATSuggestionUpdate = TableUpdate<'ats_suggestions'>;

// ========================================
// Feedback
// ========================================
export type Feedback = TableRow<'feedback'>;
export type FeedbackInsert = TableInsert<'feedback'>;
export type FeedbackUpdate = TableUpdate<'feedback'>;

export type FeedbackType = Feedback['feedback_type'];
export type FeedbackPriority = Feedback['priority'];
export type FeedbackStatus = Feedback['status'];

// ========================================
// Feedback Attachments
// ========================================
export type FeedbackAttachment = TableRow<'feedback_attachments'>;
export type FeedbackAttachmentInsert = TableInsert<'feedback_attachments'>;
export type FeedbackAttachmentUpdate = TableUpdate<'feedback_attachments'>;








