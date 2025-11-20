"use client";

import { useCVEditor } from "@/contexts/CVEditorContext";
import { useTranslation } from "@/hooks/useTranslation";
import StepNavigation from "@/components/editor/StepNavigation";
import LanguageSelectionStep from "@/components/editor/steps/LanguageSelectionStep";
import JDAnalysisStep from "@/components/editor/steps/JDAnalysisStep";
import PersonalInfoStep, {
  validatePersonalInfoStep,
} from "@/components/editor/steps/PersonalInfoStep";
import SummaryStep from "@/components/editor/steps/SummaryStep";
import ExperienceStep, {
  validateExperienceStep,
} from "@/components/editor/steps/ExperienceStep";
import EducationStep, {
  validateEducationStep,
} from "@/components/editor/steps/EducationStep";
import ProjectsStep from "@/components/editor/steps/ProjectsStep";
import SkillsStep from "@/components/editor/steps/SkillsStep";
import CertificationsStep from "@/components/editor/steps/CertificationsStep";
import ReviewStep from "@/components/editor/steps/ReviewStep";
import { showErrorToast } from "@/lib/toast-utils";
import { trackWizardStepCompleted } from "@/lib/analytics";
import { useEffect, useRef, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase-client";

type ValidationFunction =
  | ((data: Record<string, unknown>, language: "vi" | "en") => boolean)
  | ((data: Record<string, unknown>[], language: "vi" | "en") => boolean);

export default function WizardPanel() {
  const { state, setCurrentStep } = useCVEditor();
  const { t } = useTranslation();
  const stepStartTimeRef = useRef<number>(Date.now());
  const previousStepRef = useRef<number>(state.currentStep);
  const [userId, setUserId] = useState<string | null>(null);

  const STEPS = useMemo(
    () => [
      {
        id: 0,
        title: t("editor.wizard.steps.language"),
        component: LanguageSelectionStep,
        name: "LanguageSelection" as const,
      },
      {
        id: 1,
        title: t("editor.wizard.steps.jd"),
        component: JDAnalysisStep,
        name: "JDAnalysis" as const,
      },
      {
        id: 2,
        title: t("editor.wizard.steps.personalInfo"),
        component: PersonalInfoStep,
        validate: validatePersonalInfoStep as ValidationFunction,
        name: "PersonalInfo" as const,
      },
      {
        id: 3,
        title: t("editor.wizard.steps.summary"),
        component: SummaryStep,
        name: "Summary" as const,
      },
      {
        id: 4,
        title: t("editor.wizard.steps.experience"),
        component: ExperienceStep,
        validate: validateExperienceStep as ValidationFunction,
        name: "Experience" as const,
      },
      {
        id: 5,
        title: t("editor.wizard.steps.education"),
        component: EducationStep,
        validate: validateEducationStep as ValidationFunction,
        name: "Education" as const,
      },
      {
        id: 6,
        title: t("editor.wizard.steps.projects"),
        component: ProjectsStep,
        name: "Projects" as const,
      },
      {
        id: 7,
        title: t("editor.wizard.steps.skills"),
        component: SkillsStep,
        name: "Skills" as const,
      },
      {
        id: 8,
        title: t("editor.wizard.steps.certifications"),
        component: CertificationsStep,
        name: "Certifications" as const,
      },
      {
        id: 9,
        title: t("editor.wizard.steps.review"),
        component: ReviewStep,
        name: "Review" as const,
      },
    ],
    [t]
  );

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  // Track step changes
  useEffect(() => {
    const currentStep = state.currentStep;
    const previousStep = previousStepRef.current;

    // Only track if we moved to a new step (not initial load) and have required data
    if (previousStep !== currentStep && state.cvData?.id && userId) {
      const timeSpent = Math.floor(
        (Date.now() - stepStartTimeRef.current) / 1000
      );
      const previousStepConfig = STEPS[previousStep];

      // Track completion of previous step
      if (previousStepConfig) {
        try {
          trackWizardStepCompleted({
            userId: userId,
            cvId: state.cvData.id,
            stepIndex: previousStep,
            stepName: previousStepConfig.name,
            timeSpentSeconds: timeSpent,
          });
        } catch (error) {
          // Don't break the app if tracking fails
          console.error("Failed to track wizard step:", error);
        }
      }

      // Reset timer for new step
      stepStartTimeRef.current = Date.now();
    }

    previousStepRef.current = currentStep;
  }, [state.currentStep, state.cvData?.id, userId, STEPS]);

  const handleStepChange = (step: number) => {
    // If moving forward, validate current step
    if (step > state.currentStep) {
      const currentStepConfig = STEPS[state.currentStep];

      if (currentStepConfig.validate && state.cvData) {
        const language = state.cvData.language || "vi";
        let isValid = false;

        // Get the appropriate data for validation
        if (currentStepConfig.id === 2) {
          // PersonalInfoStep
          const personalInfo = (state.cvData.sections.personal_info ||
            {}) as Record<string, unknown>;
          isValid = (
            currentStepConfig.validate as (
              data: Record<string, unknown>,
              lang: "vi" | "en"
            ) => boolean
          )(personalInfo, language);
        } else if (currentStepConfig.id === 4) {
          // ExperienceStep
          const experience = (state.cvData.sections.experience || []) as Record<
            string,
            unknown
          >[];
          isValid = (
            currentStepConfig.validate as (
              data: Record<string, unknown>[],
              lang: "vi" | "en"
            ) => boolean
          )(experience, language);
        } else if (currentStepConfig.id === 5) {
          // EducationStep
          const education = (state.cvData.sections.education || []) as Record<
            string,
            unknown
          >[];
          isValid = (
            currentStepConfig.validate as (
              data: Record<string, unknown>[],
              lang: "vi" | "en"
            ) => boolean
          )(education, language);
        }

        if (!isValid) {
          const errorMessages = {
            vi: t("editor.wizard.validationError"),
            en: t("editor.wizard.validationError"),
          };
          showErrorToast(errorMessages[language], language);
          return;
        }
      }
    }

    setCurrentStep(step);
  };

  const CurrentStepComponent = STEPS[state.currentStep]?.component;
  const totalSteps = STEPS.length;
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === totalSteps - 1;
  const shouldShowFooterNav = true;
  const selectedLanguage = state.selectedLanguage || state.cvData?.language;
  const hasCVData = Boolean(state.cvData);

  let isNextDisabled = state.isLoading;

  if (state.currentStep === 0) {
    isNextDisabled = isNextDisabled || !selectedLanguage;
  } else {
    isNextDisabled = isNextDisabled || !hasCVData;
  }

  if (state.currentStep === 1) {
    isNextDisabled = isNextDisabled || !state.cvData?.jd_analysis;
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      handleStepChange(state.currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep && !isNextDisabled) {
      handleStepChange(state.currentStep + 1);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="heading-feature text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">
          {t("editor.wizard.title")}
        </h2>
        <StepNavigation
          currentStep={state.currentStep}
          totalSteps={STEPS.length}
          onStepChange={handleStepChange}
          stepTitles={STEPS.map((step) => step.title)}
        />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {CurrentStepComponent && <CurrentStepComponent />}
      </div>

      {shouldShowFooterNav && (
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-white">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                isFirstStep
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t("editor.wizard.back")}
            </button>

            {!isLastStep && (
              <button
                type="button"
                onClick={handleNext}
                disabled={isNextDisabled}
                className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  isNextDisabled
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {t("editor.wizard.next")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
