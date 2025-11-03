/**
 * FastRezu Analytics Integration Examples
 * 
 * Các ví dụ thực tế về cách tích hợp tracking vào components và API routes
 */

import React, { useState, useEffect } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { logger, measurePerformance, logAIOperation } from '@/lib/logger';
import { track } from '@vercel/analytics/server';
import {
  trackWizardStepCompleted,
  trackCVCreated,
  trackWizardCompleted,
  trackAIFeatureUsed,
  trackAISuggestionApplied,
  trackAISuggestionDismissed,
  trackCheckerFlowStarted,
  trackCheckerFileUploaded,
  trackCheckerTextCorrected,
  trackCheckerScoreGenerated,
  trackFrontendError,
  trackCVExported,
  trackFeedbackSubmitted,
} from '@/lib/analytics';

// ============================================================================
// EXAMPLE 1: Wizard Component - Track Step Completion
// ============================================================================

'use client';

export function CVWizard({ userId, cvId }: { userId: string; cvId: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const [wizardStartTime] = useState(Date.now());
  const [aiUsageCount, setAiUsageCount] = useState(0);

  const steps = [
    'LanguageSelection',
    'JDAnalysis',
    'PersonalInfo',
    'Summary',
    'Experience',
    'Education',
    'Skills',
    'Projects',
    'Certifications',
    'Review',
  ];

  // Track step completion when moving forward
  const handleNextStep = () => {
    const timeSpent = Math.floor((Date.now() - stepStartTime) / 1000);
    
    // CRITICAL: Track step completion for funnel analysis
    trackWizardStepCompleted({
      userId,
      cvId,
      stepIndex: currentStep,
      stepName: steps[currentStep] as any,
      timeSpentSeconds: timeSpent,
    });

    setCurrentStep(prev => prev + 1);
    setStepStartTime(Date.now());
  };

  // Track wizard completion
  const handleFinish = () => {
    const totalTimeMinutes = Math.floor((Date.now() - wizardStartTime) / 60000);
    
    trackWizardCompleted({
      userId,
      cvId,
      language: 'vi', // Get from state
      totalTimeMinutes,
      aiFeatureUsageCount: aiUsageCount,
    });
  };

  return (
    <div>
      {/* Wizard UI */}
      <button onClick={handleNextStep}>Tiếp tục</button>
      <button onClick={handleFinish}>Hoàn thành</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: AI Feature Integration
// ============================================================================

'use client';

export function AIGenerateSummary({ userId, cvId }: { userId: string; cvId: string }) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        body: JSON.stringify({ cvId, language: 'vi' }),
      });

      const duration = performance.now() - startTime;
      const success = response.ok;

      // Track AI feature usage
      trackAIFeatureUsed({
        userId,
        cvId,
        language: 'vi',
        featureName: 'generate_summary',
        responseTimeMs: duration,
        success,
      });

      if (success) {
        const data = await response.json();
        // Update UI with generated summary
      }
    } catch (error) {
      // Track failed AI call
      trackAIFeatureUsed({
        userId,
        cvId,
        language: 'vi',
        featureName: 'generate_summary',
        responseTimeMs: performance.now() - startTime,
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleGenerate} disabled={loading}>
      {loading ? 'Đang tạo...' : 'Tạo Summary bằng AI'}
    </button>
  );
}

// ============================================================================
// EXAMPLE 3: ATS Optimization Panel - Track Suggestion Actions
// ============================================================================

'use client';

interface Suggestion {
  id: string;
  type: 'keyword_missing' | 'format_improvement' | 'content_enhancement';
  priority: 'high' | 'medium' | 'low';
  content: string;
  index: number;
}

export function ATSOptimizationPanel({
  userId,
  cvId,
  suggestions,
}: {
  userId: string;
  cvId: string;
  suggestions: Suggestion[];
}) {
  const handleApplySuggestion = (suggestion: Suggestion) => {
    // Apply the suggestion to CV
    applySuggestion(suggestion);

    // Track that user applied the suggestion
    trackAISuggestionApplied({
      userId,
      cvId,
      suggestionType: suggestion.type,
      priority: suggestion.priority,
      suggestionIndex: suggestion.index,
    });
  };

  const handleDismissSuggestion = (suggestion: Suggestion) => {
    // Track that user dismissed/ignored the suggestion
    trackAISuggestionDismissed({
      userId,
      cvId,
      suggestionType: suggestion.type,
      priority: suggestion.priority,
    });
  };

  return (
    <div>
      {suggestions.map(suggestion => (
        <div key={suggestion.id}>
          <p>{suggestion.content}</p>
          <button onClick={() => handleApplySuggestion(suggestion)}>
            Áp dụng
          </button>
          <button onClick={() => handleDismissSuggestion(suggestion)}>
            Bỏ qua
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Checker Flow - File Upload & Score Generation
// ============================================================================

'use client';

export function CVChecker({ userId }: { userId: string }) {
  useEffect(() => {
    // Track when user enters checker flow
    trackCheckerFlowStarted({ userId });
  }, [userId]);

  const handleFileUpload = async (file: File) => {
    try {
      // Upload and extract text
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/cv/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const fileSizeKb = Math.round(file.size / 1024);
        const fileType = file.name.endsWith('.pdf') ? 'pdf' : 'docx';

        // Track successful upload
        trackCheckerFileUploaded({
          userId,
          fileType,
          fileSizeKb,
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleTextConfirmed = (originalText: string, correctedText: string) => {
    // Track text correction
    trackCheckerTextCorrected({
      userId,
      textLengthOriginal: originalText.length,
      textLengthCorrected: correctedText.length,
    });
  };

  const handleGenerateScore = async (cvText: string, jdText?: string) => {
    try {
      const response = await fetch('/api/ai/score-cv', {
        method: 'POST',
        body: JSON.stringify({ cvText, jdText }),
      });

      const { score } = await response.json();

      // Track successful score generation
      trackCheckerScoreGenerated({
        userId,
        finalScore: score,
        withJD: !!jdText,
      });
    } catch (error) {
      console.error('Score generation failed:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} />
      {/* Rest of UI */}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: API Route with Logging and Performance Tracking
// ============================================================================

export async function POST(req: NextRequest) {
  // Create logger with request context
  const requestLogger = logger.child({
    path: req.nextUrl.pathname,
    method: req.method,
  });

  try {
    // Parse request
    const { cvText, jdText } = await req.json();
    requestLogger.info('Received ATS score request', {
      cvTextLength: cvText.length,
      hasJD: !!jdText,
    });

    // Measure performance of the entire operation
    const result = await measurePerformance(
      '/api/ai/score-cv',
      async () => {
        // Log AI operation with automatic tracking
        const score = await logAIOperation(
          'score_cv_checker',
          async () => {
            // Your AI logic here
            return await calculateATSScore(cvText, jdText);
          },
          {
            userId: 'user_123', // Get from session
            language: 'vi',
            featureName: 'score_cv_checker',
          }
        );

        return { score };
      },
      { userId: 'user_123' }
    );

    requestLogger.info('Request completed successfully', result);
    return NextResponse.json(result);

  } catch (error) {
    requestLogger.error('Request failed', error);
    
    // Track error
    await track('API_Error', {
      api_route: '/api/ai/score-cv',
      status_code: 500,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      error_type: 'ai_error',
    });

    return NextResponse.json(
      { error: 'Failed to calculate score' },
      { status: 500 }
    );
  }
}

// ============================================================================
// EXAMPLE 6: Error Boundary Integration
// ============================================================================

'use client';

import React from 'react';
import { trackFrontendError } from '@/lib/analytics';

interface Props {
  children: React.ReactNode;
  userId?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // Track frontend error
    trackFrontendError({
      userId: this.props.userId,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'AppErrorBoundary',
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Đã xảy ra lỗi</h1>
          <p>Chúng tôi đã ghi nhận lỗi và sẽ khắc phục sớm nhất.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// EXAMPLE 7: Export Button with Conversion Tracking
// ============================================================================

'use client';

import { trackCVExported } from '@/lib/analytics';

export function ExportButtons({ userId, cvId }: { userId: string; cvId: string }) {
  const handleExportPDF = async () => {
    try {
      // Generate and download PDF
      await generateAndDownloadPDF(cvId);

      // Track successful export - this is a KEY CONVERSION EVENT
      trackCVExported({
        userId,
        cvId,
        exportType: 'pdf',
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleCopyText = async () => {
    try {
      // Copy to clipboard
      await copyToClipboard(cvId);

      // Track text export
      trackCVExported({
        userId,
        cvId,
        exportType: 'text',
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleExportPDF}>📥 Tải xuống PDF</button>
      <button onClick={handleCopyText}>📋 Sao chép văn bản</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Feedback Form
// ============================================================================

'use client';

import { useState } from 'react';
import { trackFeedbackSubmitted } from '@/lib/analytics';

export function FeedbackForm({ userId }: { userId?: string }) {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'feature_request'>('suggestion');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleSubmit = async () => {
    try {
      // Submit feedback to API
      await submitFeedback({ type: feedbackType, message, attachment });

      // Track feedback submission
      trackFeedbackSubmitted({
        userId: userId || 'anonymous',
        feedbackType,
        priority: feedbackType === 'bug' ? 'high' : 'medium',
        hasAttachment: !!attachment,
      });

      // Show success message
      alert('Cảm ơn bạn đã gửi feedback!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div>
      <select value={feedbackType} onChange={(e) => setFeedbackType(e.target.value as any)}>
        <option value="bug">Báo lỗi</option>
        <option value="suggestion">Góp ý</option>
        <option value="feature_request">Đề xuất tính năng</option>
      </select>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} />
      <input type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
      <button onClick={handleSubmit}>Gửi</button>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS (implement these based on your actual code)
// ============================================================================

async function applySuggestion(suggestion: any) {
  // Implementation
}

async function calculateATSScore(cvText: string, jdText?: string): Promise<number> {
  // Implementation
  return 75;
}

async function generateAndDownloadPDF(cvId: string) {
  // Implementation
}

async function copyToClipboard(cvId: string) {
  // Implementation
}

async function submitFeedback(data: any) {
  // Implementation
}
