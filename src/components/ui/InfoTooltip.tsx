"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/hooks/useTranslation";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";
export type TooltipIcon = "info" | "lightbulb" | "warning";

interface InfoTooltipProps {
  id: string; // Unique ID for dismissal tracking
  title: string;
  content: string;
  placement?: TooltipPlacement;
  icon?: TooltipIcon;
  dismissible?: boolean;
  children?: React.ReactNode; // Trigger element
}

/**
 * InfoTooltip component provides educational tooltips with dismissible functionality
 * and localStorage tracking to prevent showing dismissed tooltips again.
 *
 * Behavior:
 * - Desktop: Tooltips are triggered on hover
 * - Mobile/Tablet: Tooltips are triggered on click/tap and closed via close button or clicking outside
 */
export default function InfoTooltip({
  id,
  title,
  content,
  placement = "bottom",
  icon = "info",
  dismissible = true,
  children,
}: InfoTooltipProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [adjustedTransform, setAdjustedTransform] = useState<string>("");
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect if device supports touch
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        "ontouchstart" in window ||
          navigator.maxTouchPoints > 0 ||
          window.innerWidth < 1024 // Consider tablets and mobile
      );
    };

    checkTouchDevice();
    window.addEventListener("resize", checkTouchDevice);

    return () => window.removeEventListener("resize", checkTouchDevice);
  }, []);

  // Check if tooltip was previously dismissed
  useEffect(() => {
    const dismissedTooltips = getDismissedTooltips();
    if (dismissedTooltips.includes(id)) {
      setIsDismissed(true);
    }
  }, [id]);

  // Calculate tooltip position when visible
  useEffect(() => {
    if (isVisible && containerRef.current) {
      const calculatePosition = () => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();

        // Get actual tooltip dimensions if available
        const tooltipWidth = tooltipRef.current?.offsetWidth || 288; // w-72 = 18rem = 288px
        const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 16; // 1rem padding from edges

        let top = 0;
        let left = 0;

        // Use fixed positioning (no scroll offset needed)
        switch (placement) {
          case "top":
            top = rect.top - tooltipHeight - 10;
            left = rect.left + rect.width / 2;
            break;
          case "bottom":
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2;
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - tooltipWidth - 10;
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + 10;
            break;
        }

        // Adjust for viewport boundaries
        let transformX = "-50%"; // Default center
        let transformY = "0";

        // Check horizontal overflow for bottom/top placements
        if (placement === "bottom" || placement === "top") {
          const tooltipLeft = left - tooltipWidth / 2;
          const tooltipRight = left + tooltipWidth / 2;

          if (tooltipLeft < padding) {
            // Tooltip overflows left edge - align to left
            left = padding;
            transformX = "0";
          } else if (tooltipRight > viewportWidth - padding) {
            // Tooltip overflows right edge - align to right
            left = viewportWidth - padding;
            transformX = "-100%";
          }
        }

        // Set transform based on placement and adjustments
        if (placement === "top") {
          transformY = "-100%";
        } else if (placement === "left") {
          transformX = "-100%";
          transformY = "-50%";
        } else if (placement === "right") {
          transformX = "0";
          transformY = "-50%";
        }

        // Check vertical overflow
        if (top < padding) {
          // Tooltip overflows top edge, position below instead
          top = rect.bottom + 10;
          transformY = "0";
        } else if (top + tooltipHeight > viewportHeight - padding) {
          // Tooltip overflows bottom edge, position above instead
          top = rect.top - tooltipHeight - 10;
          transformY = "-100%";
        }

        setTooltipPosition({ top, left });
        setAdjustedTransform(`translate(${transformX}, ${transformY})`);
      };

      // Calculate immediately
      calculatePosition();

      // Recalculate after a short delay to get accurate tooltip dimensions
      const timeoutId = setTimeout(calculatePosition, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, placement]);

  // Handle keyboard navigation and click outside for touch devices
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isVisible) {
        setIsVisible(false);
      }
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Only handle click outside on touch devices
      if (
        isTouchDevice &&
        isVisible &&
        tooltipRef.current &&
        containerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleKeyDown);
      if (isTouchDevice) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [isVisible, isTouchDevice]);

  const handleMouseEnter = () => {
    // Only handle hover on non-touch devices
    if (!isTouchDevice) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    // Only handle hover on non-touch devices
    if (!isTouchDevice) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 200);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // On touch devices, toggle tooltip on click
    if (isTouchDevice) {
      e.preventDefault();
      e.stopPropagation();
      setIsVisible(!isVisible);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    saveDismissedTooltip(id);
  };

  // Don't render if dismissed
  if (isDismissed) {
    return children ? <>{children}</> : null;
  }

  // Icon SVG paths
  const iconPaths = {
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    lightbulb:
      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    warning:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  };

  // Use adjusted transform if available, otherwise use default
  const getTransformStyle = () => {
    if (adjustedTransform) {
      return adjustedTransform;
    }
    // Fallback
    switch (placement) {
      case "top":
        return "translate(-50%, -100%)";
      case "bottom":
        return "translate(-50%, 0)";
      case "left":
        return "translate(-100%, -50%)";
      case "right":
        return "translate(0, -50%)";
      default:
        return "translate(-50%, 0)";
    }
  };

  // Arrow styles
  const arrowStyles = {
    top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-6 border-r-6 border-t-6 border-transparent border-t-gray-900",
    bottom:
      "top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-6 border-r-6 border-b-6 border-transparent border-b-gray-900",
    left: "right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-6 border-b-6 border-l-6 border-transparent border-l-gray-900",
    right:
      "left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-6 border-b-6 border-r-6 border-transparent border-r-gray-900",
  };

  // Render tooltip content
  const tooltipContent = isVisible && (
    <div
      ref={tooltipRef}
      id={`tooltip-${id}`}
      role="tooltip"
      className="fixed z-99999 animate-fadeIn pointer-events-auto"
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
        transform: getTransformStyle(),
      }}
      onMouseEnter={!isTouchDevice ? handleMouseEnter : undefined}
      onMouseLeave={!isTouchDevice ? handleMouseLeave : undefined}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl p-4 w-72 sm:w-80 max-w-[calc(100vw-2rem)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <svg
              className="w-5 h-5 shrink-0 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={iconPaths[icon]}
              />
            </svg>
            <h3 className="font-semibold text-sm truncate">{title}</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors shrink-0 p-1 -m-1"
            aria-label={t('tooltip.close')}
          >
            <svg
              className="w-4 h-4"
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
        </div>

        {/* Content */}
        <p className="text-sm text-gray-200 leading-relaxed">{content}</p>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors underline"
          >
            {t('tooltip.dismiss')}
          </button>
        )}
      </div>

      {/* Arrow */}
      <div className={`absolute w-0 h-0 ${arrowStyles[placement]}`} />
    </div>
  );

  return (
    <>
      <div
        ref={containerRef}
        className="inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Trigger Button */}
        {children ? (
          <div>{children}</div>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center w-5 h-5 text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full"
            aria-label={title}
            aria-describedby={`tooltip-${id}`}
            aria-expanded={isVisible}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={iconPaths[icon]}
              />
            </svg>
          </button>
        )}
      </div>

      {/* Tooltip Content - Rendered via Portal */}
      {typeof window !== "undefined" &&
        tooltipContent &&
        createPortal(tooltipContent, document.body)}
    </>
  );
}

// Helper functions for localStorage management
function getDismissedTooltips(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const dismissed = localStorage.getItem("dismissedTooltips");
    return dismissed ? JSON.parse(dismissed) : [];
  } catch (error) {
    console.error("Error reading dismissed tooltips:", error);
    return [];
  }
}

function saveDismissedTooltip(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const dismissed = getDismissedTooltips();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem("dismissedTooltips", JSON.stringify(dismissed));
    }
  } catch (error) {
    console.error("Error saving dismissed tooltip:", error);
  }
}
