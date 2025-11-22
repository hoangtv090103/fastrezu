"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { useEffect, useRef } from "react";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  stepTitles: string[];
}

export default function StepNavigation({
  currentStep,
  totalSteps,
  onStepChange,
  stepTitles,
}: StepNavigationProps) {
  const { t } = useTranslation();
  const steps = Array.from({ length: totalSteps }, (_, i) => i);
  const stepRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current step when it changes
  useEffect(() => {
    const currentStepButton = stepRefs.current[currentStep];
    const container = containerRef.current;

    if (currentStepButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = currentStepButton.getBoundingClientRect();

      // Check if button is outside the visible area
      const isOutsideLeft = buttonRect.left < containerRect.left;
      const isOutsideRight = buttonRect.right > containerRect.right;

      if (isOutsideLeft || isOutsideRight) {
        // Scroll the button into view with smooth behavior
        currentStepButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentStep]);

  return (
    <div className="space-y-1 sm:space-y-2">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
        <div
          className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step Indicators and Labels Combined - with horizontal scroll */}
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-1"
      >
        <div className="flex gap-1 sm:gap-1 min-w-min px-0">
          {steps.map((step) => (
            <div
              key={step}
              className="flex flex-col items-center gap-0.5 sm:gap-1 shrink-0 w-14 sm:w-16"
            >
              {/* Step Button */}
              <button
                ref={(el) => {
                  stepRefs.current[step] = el;
                }}
                onClick={() => onStepChange(step)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  step === currentStep
                    ? "bg-blue-600 text-white focus:ring-blue-500 shadow-md"
                    : step < currentStep
                    ? "bg-green-500 text-white focus:ring-green-500 hover:bg-green-600"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300 focus:ring-gray-400"
                }`}
                aria-label={`${
                  stepTitles[step] ||
                  `${t("editor.wizard.stepLabel")} ${step + 1}`
                }${
                  step === currentStep
                    ? ` (${t("editor.wizard.currentStep")})`
                    : step < currentStep
                    ? ` (${t("editor.wizard.completedStep")})`
                    : ""
                }`}
                aria-current={step === currentStep ? "step" : undefined}
              >
                {step + 1}
              </button>

              {/* Step Label - wrapped text */}
              <span
                className={`text-center text-[10px] sm:text-xs leading-tight text-gray-500 whitespace-normal break-words ${
                  step === currentStep ? "text-blue-600 font-medium" : ""
                }`}
              >
                {stepTitles[step] || `Bước ${step + 1}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
