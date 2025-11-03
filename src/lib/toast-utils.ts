import toast from 'react-hot-toast';
import { AppError, ERROR_MESSAGES } from './error-handler';

/**
 * Toast utility functions that integrate with the error handler
 * to provide consistent, user-friendly notifications across the app.
 */

/**
 * Show a success toast notification
 */
export function showSuccessToast(message: string, duration?: number) {
  return toast.success(message, {
    duration: duration || 3000,
  });
}

/**
 * Show an error toast notification
 * Automatically extracts user-friendly message from AppError instances
 */
export function showErrorToast(error: unknown, language: 'vi' | 'en' = 'vi', duration?: number) {
  let message: string;

  if (error instanceof AppError) {
    message = error.userMessage;
  } else if (error instanceof Error) {
    // For generic errors, use a default message
    message = ERROR_MESSAGES[language].unknown_error;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = ERROR_MESSAGES[language].unknown_error;
  }

  return toast.error(message, {
    duration: duration || 5000,
  });
}

/**
 * Show a warning toast notification (for validation warnings)
 */
export function showWarningToast(message: string, duration?: number) {
  return toast(message, {
    icon: '⚠️',
    duration: duration || 4000,
    style: {
      background: '#fef3c7',
      color: '#92400e',
      border: '1px solid #fbbf24',
    },
  });
}

/**
 * Show an info toast notification
 */
export function showInfoToast(message: string, duration?: number) {
  return toast(message, {
    icon: 'ℹ️',
    duration: duration || 4000,
    style: {
      background: '#dbeafe',
      color: '#1e40af',
      border: '1px solid #60a5fa',
    },
  });
}

/**
 * Show a loading toast notification
 * Returns the toast ID which can be used to dismiss or update the toast
 */
export function showLoadingToast(message: string) {
  return toast.loading(message);
}

/**
 * Dismiss a specific toast by ID
 */
export function dismissToast(toastId: string) {
  toast.dismiss(toastId);
}

/**
 * Update an existing toast (useful for loading states)
 */
export function updateToast(toastId: string, message: string, type: 'success' | 'error') {
  if (type === 'success') {
    toast.success(message, { id: toastId });
  } else {
    toast.error(message, { id: toastId });
  }
}

/**
 * Show a promise toast that automatically handles loading, success, and error states
 */
export function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
  }
) {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: (err) => {
        if (typeof messages.error === 'function') {
          return messages.error(err);
        }
        if (err instanceof AppError) {
          return err.userMessage;
        }
        return messages.error;
      },
    },
    {
      success: {
        duration: 3000,
      },
      error: {
        duration: 5000,
      },
    }
  );
}
