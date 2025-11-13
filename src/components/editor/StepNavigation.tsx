"use client";

import { useTranslation } from "@/hooks/useTranslation";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  stepTitles: string[];
}

export default function StepNavigation({ currentStep, totalSteps, onStepChange, stepTitles }: StepNavigationProps) {
  const { t } = useTranslation();
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
        <div
          className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step Indicators and Labels Combined */}
      <div className="flex">
        {steps.map((step) => (
          <div key={step} className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2">
            {/* Step Button */}
            <button
              onClick={() => onStepChange(step)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                step === currentStep
                  ? 'bg-blue-600 text-white focus:ring-blue-500 shadow-md'
                  : step < currentStep
                  ? 'bg-green-500 text-white focus:ring-green-500 hover:bg-green-600'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300 focus:ring-gray-400'
              }`}
              aria-label={`${stepTitles[step] || `${t('editor.wizard.stepLabel')} ${step + 1}`}${step === currentStep ? ` (${t('editor.wizard.currentStep')})` : step < currentStep ? ` (${t('editor.wizard.completedStep')})` : ''}`}
              aria-current={step === currentStep ? 'step' : undefined}
            >
              {step + 1}
            </button>
            
            {/* Step Label */}
            <span
              className={`text-center text-xs text-gray-500 hidden sm:block ${
                step === currentStep ? 'text-blue-600 font-medium' : ''
              }`}
            >
              {stepTitles[step] || `Bước ${step + 1}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
