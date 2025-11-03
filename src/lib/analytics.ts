/**
 * FastRezu Analytics & Event Tracking
 * 
 * This module provides a centralized tracking system for user behavior analytics
 * using Vercel Analytics. It tracks events across two main user funnels:
 * 
 * 1. Creator Funnel (Wizard): Users create CV from scratch
 * 2. Checker Funnel (Upload): Users check existing CV
 * 
 * All events are designed to measure activation, conversion, AI engagement,
 * and identify friction points in the user journey.
 */

import { track } from '@vercel/analytics';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Language options for CV creation
 */
type Language = 'vi' | 'en';

/**
 * Wizard step names matching the actual flow
 */
type WizardStep =
  | 'LanguageSelection'
  | 'JDAnalysis'
  | 'PersonalInfo'
  | 'Summary'
  | 'Experience'
  | 'Education'
  | 'Skills'
  | 'Projects'
  | 'Certifications'
  | 'Review';

/**
 * Export types for CV download
 */
type ExportType = 'pdf' | 'text';

/**
 * File types supported for CV upload
 */
type FileType = 'pdf' | 'docx';

/**
 * AI features available in the app
 */
type AIFeature =
  | 'analyze_jd'
  | 'generate_summary'
  | 'write_experience'
  | 'improve_bullet'
  | 'extract_skills'
  | 'score_cv_wizard'
  | 'score_cv_checker'
  | 'generate_projects'
  | 'optimize_keywords';

/**
 * Suggestion types for ATS optimization
 */
type SuggestionType =
  | 'keyword_missing'
  | 'format_improvement'
  | 'content_enhancement'
  | 'ats_optimization';

/**
 * Priority levels for suggestions
 */
type Priority = 'high' | 'medium' | 'low';

/**
 * Feedback types
 */
type FeedbackType = 'bug' | 'suggestion' | 'feature_request' | 'other';

// ============================================================================
// 1. ACTIVATION & FUNNEL COMPLETION TRACKING
// ============================================================================

/**
 * Track when a user creates a new CV (start of Creator funnel)
 */
export function trackCVCreated(params: {
  userId: string;
  cvId: string;
  language: Language;
}) {
  track('CV_Created', {
    user_id: params.userId,
    cv_id: params.cvId,
    language: params.language,
  });
}

/**
 * Track wizard step completion (critical for funnel analysis)
 * This is the MOST IMPORTANT event for understanding drop-off points
 */
export function trackWizardStepCompleted(params: {
  userId: string;
  cvId: string;
  stepIndex: number; // 0-9
  stepName: WizardStep;
  timeSpentSeconds?: number; // Optional: how long user spent on this step
}) {
  const eventData: Record<string, string | number | boolean> = {
    user_id: params.userId,
    cv_id: params.cvId,
    step_index: params.stepIndex,
    step_name: params.stepName,
  };
  
  if (params.timeSpentSeconds !== undefined) {
    eventData.time_spent_seconds = params.timeSpentSeconds;
  }
  
  track('Wizard_Step_Completed', eventData);
}

/**
 * Track CV export/download (success event for Creator funnel)
 */
export function trackCVExported(params: {
  userId: string;
  cvId: string;
  exportType: ExportType;
}) {
  track('CV_Exported', {
    user_id: params.userId,
    cv_id: params.cvId,
    export_type: params.exportType,
  });
}

/**
 * Track when user starts the Checker flow
 */
export function trackCheckerFlowStarted(params: { userId: string }) {
  track('Checker_Flow_Started', {
    user_id: params.userId,
  });
}

/**
 * Track successful file upload in Checker flow
 */
export function trackCheckerFileUploaded(params: {
  userId: string;
  fileType: FileType;
  fileSizeKb: number;
}) {
  track('Checker_File_Uploaded', {
    user_id: params.userId,
    file_type: params.fileType,
    file_size_kb: params.fileSizeKb,
  });
}

/**
 * Track when user confirms/corrects extracted text
 */
export function trackCheckerTextCorrected(params: {
  userId: string;
  textLengthOriginal: number;
  textLengthCorrected: number;
}) {
  track('Checker_Text_Corrected', {
    user_id: params.userId,
    text_length_original: params.textLengthOriginal,
    text_length_corrected: params.textLengthCorrected,
    // Calculate edit distance percentage
    edit_percentage: Math.abs(
      ((params.textLengthCorrected - params.textLengthOriginal) /
        params.textLengthOriginal) *
        100
    ).toFixed(2),
  });
}

/**
 * Track ATS score generation (success event for Checker funnel)
 */
export function trackCheckerScoreGenerated(params: {
  userId: string;
  finalScore: number;
  withJD: boolean; // Whether user provided job description
}) {
  track('Checker_Score_Generated', {
    user_id: params.userId,
    final_score: params.finalScore,
    with_jd: params.withJD,
  });
}

// ============================================================================
// 2. AI ENGAGEMENT TRACKING
// ============================================================================

/**
 * Track AI feature usage - CRITICAL for understanding feature value
 */
export function trackAIFeatureUsed(params: {
  userId: string;
  cvId?: string;
  language: Language;
  featureName: AIFeature;
  responseTimeMs?: number; // Track AI response time
  success?: boolean; // Whether AI call succeeded
}) {
  const eventData: Record<string, string | number | boolean> = {
    user_id: params.userId,
    language: params.language,
    feature_name: params.featureName,
    success: params.success ?? true,
  };
  
  if (params.cvId !== undefined) {
    eventData.cv_id = params.cvId;
  }
  if (params.responseTimeMs !== undefined) {
    eventData.response_time_ms = params.responseTimeMs;
  }
  
  track('AI_Feature_Used', eventData);
}

/**
 * Track when user applies an AI suggestion
 */
export function trackAISuggestionApplied(params: {
  userId: string;
  cvId: string;
  suggestionType: SuggestionType;
  priority: Priority;
  suggestionIndex?: number; // Position in the suggestion list
}) {
  const eventData: Record<string, string | number | boolean> = {
    user_id: params.userId,
    cv_id: params.cvId,
    suggestion_type: params.suggestionType,
    priority: params.priority,
  };
  
  if (params.suggestionIndex !== undefined) {
    eventData.suggestion_index = params.suggestionIndex;
  }
  
  track('AI_Suggestion_Applied', eventData);
}

/**
 * Track when user dismisses/ignores an AI suggestion
 */
export function trackAISuggestionDismissed(params: {
  userId: string;
  cvId: string;
  suggestionType: SuggestionType;
  priority: Priority;
}) {
  track('AI_Suggestion_Dismissed', {
    user_id: params.userId,
    cv_id: params.cvId,
    suggestion_type: params.suggestionType,
    priority: params.priority,
  });
}

// ============================================================================
// 3. FRICTION & FEEDBACK TRACKING
// ============================================================================

/**
 * Track API errors - helps identify technical issues
 */
export function trackAPIError(params: {
  userId?: string;
  apiRoute: string;
  statusCode: number;
  errorMessage: string;
  errorType?: string; // e.g., 'auth_error', 'ai_error', 'validation_error'
}) {
  const eventData: Record<string, string | number | boolean> = {
    user_id: params.userId || 'anonymous',
    api_route: params.apiRoute,
    status_code: params.statusCode,
    error_message: params.errorMessage,
  };
  
  if (params.errorType !== undefined) {
    eventData.error_type = params.errorType;
  }
  
  track('API_Error', eventData);
}

/**
 * Track frontend errors caught by ErrorBoundary
 */
export function trackFrontendError(params: {
  userId?: string;
  errorMessage: string;
  componentStack?: string;
  errorBoundary?: string; // Which error boundary caught it
}) {
  const eventData: Record<string, string | number | boolean> = {
    user_id: params.userId || 'anonymous',
    error_message: params.errorMessage,
  };
  
  if (params.componentStack !== undefined) {
    eventData.component_stack = params.componentStack;
  }
  if (params.errorBoundary !== undefined) {
    eventData.error_boundary = params.errorBoundary;
  }
  
  track('Frontend_Error', eventData);
}

/**
 * Track user feedback submission
 */
export function trackFeedbackSubmitted(params: {
  userId?: string;
  feedbackType: FeedbackType;
  priority?: Priority;
  hasAttachment?: boolean;
}) {
  const eventData: Record<string, string | number | boolean> = {
    user_id: params.userId || 'anonymous',
    feedback_type: params.feedbackType,
  };
  
  if (params.priority !== undefined) {
    eventData.priority = params.priority;
  }
  if (params.hasAttachment !== undefined) {
    eventData.has_attachment = params.hasAttachment;
  }
  
  track('Feedback_Submitted', eventData);
}

// ============================================================================
// 4. USER ENGAGEMENT TRACKING
// ============================================================================

/**
 * Track page views with additional context
 */
export function trackPageView(params: {
  userId?: string;
  pagePath: string;
  pageTitle?: string;
  referrer?: string;
}) {
  const eventData: Record<string, string | number | boolean> = {
    user_id: params.userId || 'anonymous',
    page_path: params.pagePath,
  };
  
  if (params.pageTitle !== undefined) {
    eventData.page_title = params.pageTitle;
  }
  if (params.referrer !== undefined) {
    eventData.referrer = params.referrer;
  }
  
  track('Page_View', eventData);
}

/**
 * Track user authentication events
 */
export function trackAuthEvent(params: {
  eventType: 'login' | 'logout' | 'signup' | 'magic_link_sent';
  userId?: string;
  method?: string; // e.g., 'magic_link', 'google', 'email'
}) {
  const eventData: Record<string, string | number | boolean> = {
    event_type: params.eventType,
  };
  
  if (params.userId !== undefined) {
    eventData.user_id = params.userId;
  }
  if (params.method !== undefined) {
    eventData.method = params.method;
  }
  
  track('Auth_Event', eventData);
}

/**
 * Track CV template selection
 */
export function trackTemplateSelected(params: {
  userId: string;
  cvId: string;
  templateName: string;
}) {
  track('Template_Selected', {
    user_id: params.userId,
    cv_id: params.cvId,
    template_name: params.templateName,
  });
}

/**
 * Track auto-save events
 */
export function trackAutoSave(params: {
  userId: string;
  cvId: string;
  sectionChanged: string; // Which section was auto-saved
  changesSinceLastSave?: number;
}) {
  const eventData: Record<string, string | number | boolean> = {
    user_id: params.userId,
    cv_id: params.cvId,
    section_changed: params.sectionChanged,
  };
  
  if (params.changesSinceLastSave !== undefined) {
    eventData.changes_since_last_save = params.changesSinceLastSave;
  }
  
  track('Auto_Save', eventData);
}

// ============================================================================
// 5. CONVERSION & BUSINESS METRICS
// ============================================================================

/**
 * Track when user completes the full wizard (major conversion event)
 */
export function trackWizardCompleted(params: {
  userId: string;
  cvId: string;
  language: Language;
  totalTimeMinutes: number;
  aiFeatureUsageCount: number;
}) {
  track('Wizard_Completed', {
    user_id: params.userId,
    cv_id: params.cvId,
    language: params.language,
    total_time_minutes: params.totalTimeMinutes,
    ai_feature_usage_count: params.aiFeatureUsageCount,
  });
}

/**
 * Track session duration when user leaves
 */
export function trackSessionEnd(params: {
  userId?: string;
  sessionDurationSeconds: number;
  pagesViewed: number;
  actionsCompleted: number;
}) {
  track('Session_End', {
    user_id: params.userId || 'anonymous',
    session_duration_seconds: params.sessionDurationSeconds,
    pages_viewed: params.pagesViewed,
    actions_completed: params.actionsCompleted,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user ID from session (to be implemented based on your auth system)
 */
export function getCurrentUserId(): string | undefined {
  // TODO: Implement based on your Supabase auth
  // This is a placeholder
  if (typeof window !== 'undefined') {
    // You'll integrate with your Supabase client here
    return undefined;
  }
  return undefined;
}

/**
 * Batch track multiple events (useful for form submissions)
 */
export function trackBatch(events: Array<{ name: string; data: Record<string, string | number | boolean | null> }>) {
  events.forEach(event => {
    track(event.name, event.data);
  });
}
