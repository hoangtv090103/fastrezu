"use client";

import { useState } from 'react';

export type ValidationMessageType = 'error' | 'warning' | 'info';

interface ValidationMessageProps {
  type: ValidationMessageType;
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  className?: string;
}

/**
 * ValidationMessage component displays validation errors, warnings, or info messages
 * with appropriate styling and optional dismiss functionality.
 */
export default function ValidationMessage({
  type,
  message,
  onDismiss,
  dismissible = true,
  className = '',
}: ValidationMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  // Styling based on type
  const styles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-600',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-600',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-600',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-lg ${currentStyle.container} ${className}`}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {/* Icon */}
      <div className="shrink-0">
        <svg
          className={`h-5 w-5 ${currentStyle.icon}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={currentStyle.iconPath}
          />
        </svg>
      </div>

      {/* Message */}
      <div className="flex-1 text-sm">
        {message}
      </div>

      {/* Dismiss Button */}
      {dismissible && type !== 'error' && (
        <button
          onClick={handleDismiss}
          className={`shrink-0 ${currentStyle.icon} hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded transition-opacity`}
          aria-label="Đóng thông báo"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
