"use client";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  stepTitles: string[];
}

export default function StepNavigation({ currentStep, totalSteps, onStepChange, stepTitles }: StepNavigationProps) {
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

      {/* Step Indicators */}
      <div className="flex">
        {steps.map((step) => (
          <div key={step} className="flex-1 flex justify-center">
            <button
              onClick={() => onStepChange(step)}
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 ${
                step === currentStep
                  ? 'bg-blue-600 text-white'
                  : step < currentStep
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {step + 1}
            </button>
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex text-xs text-gray-500">
        {steps.map((step) => (
          <div key={step} className="flex-1 flex justify-center">
            <span
              className={`text-center hidden sm:block ${
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
