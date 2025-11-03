/**
 * FastRezu Server-Side Logger
 * 
 * This module provides server-side logging utilities for API routes and server actions.
 * It integrates with Vercel's logging infrastructure and provides structured logging
 * for monitoring, debugging, and error tracking.
 * 
 * Features:
 * - Structured logging with contextual information
 * - Error tracking with stack traces
 * - Performance monitoring
 * - Request/response logging
 * - Integration with Vercel Analytics server-side tracking
 */

import { track } from '@vercel/analytics/server';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  cvId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  [key: string]: unknown;
}

interface PerformanceMetrics {
  duration: number;
  timestamp: number;
  endpoint: string;
  success: boolean;
}

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, {
        ...this.context,
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: Record<string, unknown>) {
    console.log(`[INFO] ${message}`, {
      ...this.context,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log warnings
   */
  warn(message: string, data?: Record<string, unknown>) {
    console.warn(`[WARN] ${message}`, {
      ...this.context,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log errors with stack trace
   */
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
    const errorData: Record<string, unknown> = {
      ...this.context,
      ...data,
      timestamp: new Date().toISOString(),
    };

    if (error instanceof Error) {
      errorData.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    } else if (error) {
      errorData.error = error;
    }

    console.error(`[ERROR] ${message}`, errorData);

    // Track error in Vercel Analytics (if in production)
    if (process.env.NODE_ENV === 'production') {
      this.trackServerError(message, error);
    }
  }

  /**
   * Track server-side error in Vercel Analytics
   */
  private async trackServerError(message: string, error?: Error | unknown) {
    try {
      const eventData: Record<string, string | number | boolean> = {
        error_message: message,
        environment: process.env.NODE_ENV || 'unknown',
      };

      if (this.context.userId) eventData.user_id = this.context.userId;
      if (this.context.path) eventData.path = this.context.path;
      if (this.context.method) eventData.method = this.context.method;

      if (error instanceof Error) {
        eventData.error_name = error.name;
        if (error.stack) eventData.has_stack = true;
      }

      await track('Server_Error', eventData);
    } catch (trackError) {
      // Don't let tracking errors break the app
      console.error('[Logger] Failed to track error:', trackError);
    }
  }

  /**
   * Log API request
   */
  async logRequest(req: {
    method: string;
    url: string;
    headers?: Record<string, unknown>;
    body?: unknown;
  }) {
    this.info('API Request', {
      method: req.method,
      url: req.url,
      hasBody: !!req.body,
    });
  }

  /**
   * Log API response
   */
  async logResponse(res: {
    status: number;
    statusText?: string;
    data?: unknown;
  }) {
    const level: LogLevel = res.status >= 400 ? 'error' : 'info';
    const message = `API Response: ${res.status}`;

    if (level === 'error') {
      this.error(message, undefined, {
        status: res.status,
        statusText: res.statusText,
      });
    } else {
      this.info(message, {
        status: res.status,
      });
    }
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Measure and log API endpoint performance
 */
export async function measurePerformance<T>(
  endpoint: string,
  operation: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const startTime = performance.now();
  const logger = new Logger(context);
  let success = false;

  try {
    logger.debug(`Starting operation: ${endpoint}`);
    const result = await operation();
    success = true;
    return result;
  } catch (error) {
    logger.error(`Operation failed: ${endpoint}`, error);
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    
    logger.info(`Operation completed: ${endpoint}`, {
      duration_ms: duration.toFixed(2),
      success,
    });

    // Track performance in production
    if (process.env.NODE_ENV === 'production') {
      trackPerformance({
        endpoint,
        duration,
        timestamp: Date.now(),
        success,
      });
    }
  }
}

/**
 * Track performance metrics to Vercel Analytics
 */
async function trackPerformance(metrics: PerformanceMetrics) {
  try {
    await track('API_Performance', {
      endpoint: metrics.endpoint,
      duration_ms: Math.round(metrics.duration),
      success: metrics.success,
      timestamp: metrics.timestamp,
    });
  } catch (error) {
    console.error('[Performance] Failed to track metrics:', error);
  }
}

// ============================================================================
// AI OPERATION LOGGING
// ============================================================================

/**
 * Log AI operation with tracking
 */
export async function logAIOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: {
    userId?: string;
    cvId?: string;
    language?: string;
    featureName?: string;
  }
): Promise<T> {
  const logger = new Logger(context);
  const startTime = performance.now();
  let success = false;

  try {
    logger.info(`AI Operation started: ${operation}`);
    const result = await fn();
    success = true;
    return result;
  } catch (error) {
    logger.error(`AI Operation failed: ${operation}`, error);
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    
    logger.info(`AI Operation completed: ${operation}`, {
      duration_ms: duration.toFixed(2),
      success,
    });

    // Track AI usage server-side
    if (process.env.NODE_ENV === 'production' && context?.featureName) {
      try {
        const eventData: Record<string, string | number | boolean> = {
          feature_name: context.featureName,
          response_time_ms: Math.round(duration),
          success,
        };

        if (context.userId) eventData.user_id = context.userId;
        if (context.cvId) eventData.cv_id = context.cvId;
        if (context.language) eventData.language = context.language;

        await track('AI_Operation_Server', eventData);
      } catch (trackError) {
        logger.debug('Failed to track AI operation', { error: trackError });
      }
    }
  }
}

// ============================================================================
// EXPORT DEFAULT LOGGER INSTANCE
// ============================================================================

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger with specific context
 */
export function createLogger(context: LogContext): Logger {
  return new Logger(context);
}

/**
 * Helper to log and track server-side events
 */
export async function logAndTrack(
  eventName: string,
  message: string,
  data: Record<string, string | number | boolean | null>
) {
  logger.info(message, data);
  
  if (process.env.NODE_ENV === 'production') {
    try {
      await track(eventName, data);
    } catch (error) {
      logger.debug('Failed to track event', { error, eventName });
    }
  }
}

/**
 * Log database operations
 */
export async function logDatabaseOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const logger = new Logger(context);
  const startTime = performance.now();

  try {
    logger.debug(`DB Operation: ${operation}`);
    const result = await fn();
    const duration = performance.now() - startTime;
    
    logger.debug(`DB Operation completed: ${operation}`, {
      duration_ms: duration.toFixed(2),
    });
    
    return result;
  } catch (error) {
    logger.error(`DB Operation failed: ${operation}`, error);
    throw error;
  }
}
