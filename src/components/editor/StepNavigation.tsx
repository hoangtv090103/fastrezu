"use client";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
}

export default function StepNavigation({ currentStep, totalSteps, onStepChange }: StepNavigationProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between">
        {steps.map((step) => (
          <button
            key={step}
            onClick={() => onStepChange(step)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors duration-200 ${
              step === currentStep
                ? 'bg-blue-600 text-white'
                : step < currentStep
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {step + 1}
          </button>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between text-xs text-gray-500">
        {steps.map((step) => (
          <span
            key={step}
            className={`text-center ${
              step === currentStep ? 'text-blue-600 font-medium' : ''
            }`}
            style={{ width: `${100 / totalSteps}%` }}
          >
            Bước {step + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
