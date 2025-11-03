"use client";

import { useCVEditor } from "@/contexts/CVEditorContext";
import StepNavigation from "@/components/editor/StepNavigation";
import LanguageSelectionStep from "@/components/editor/steps/LanguageSelectionStep";
import JDAnalysisStep from "@/components/editor/steps/JDAnalysisStep";
import PersonalInfoStep, { validatePersonalInfoStep } from "@/components/editor/steps/PersonalInfoStep";
import SummaryStep from "@/components/editor/steps/SummaryStep";
import ExperienceStep, { validateExperienceStep } from "@/components/editor/steps/ExperienceStep";
import EducationStep, { validateEducationStep } from "@/components/editor/steps/EducationStep";
import ProjectsStep from "@/components/editor/steps/ProjectsStep";
import SkillsStep from "@/components/editor/steps/SkillsStep";
import CertificationsStep from "@/components/editor/steps/CertificationsStep";
import ReviewStep from "@/components/editor/steps/ReviewStep";
import { showErrorToast } from "@/lib/toast-utils";
import { trackWizardStepCompleted } from "@/lib/analytics";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type ValidationFunction = 
  | ((data: Record<string, unknown>, language: 'vi' | 'en') => boolean)
  | ((data: Record<string, unknown>[], language: 'vi' | 'en') => boolean);

const STEPS = [
  { id: 0, title: "Ngôn ngữ", component: LanguageSelectionStep, name: 'LanguageSelection' as const },
  { id: 1, title: "JD", component: JDAnalysisStep, name: 'JDAnalysis' as const },
  { id: 2, title: "Thông tin", component: PersonalInfoStep, validate: validatePersonalInfoStep as ValidationFunction, name: 'PersonalInfo' as const },
  { id: 3, title: "Nghề nghiệp", component: SummaryStep, name: 'Summary' as const },
  { id: 4, title: "Kinh nghiệm", component: ExperienceStep, validate: validateExperienceStep as ValidationFunction, name: 'Experience' as const },
  { id: 5, title: "Học vấn", component: EducationStep, validate: validateEducationStep as ValidationFunction, name: 'Education' as const },
  { id: 6, title: "Dự án", component: ProjectsStep, name: 'Projects' as const },
  { id: 7, title: "Kỹ năng", component: SkillsStep, name: 'Skills' as const },
  { id: 8, title: "Chứng chỉ", component: CertificationsStep, name: 'Certifications' as const },
  { id: 9, title: "Review", component: ReviewStep, name: 'Review' as const },
];

export default function WizardPanel() {
  const { state, setCurrentStep } = useCVEditor();
  const stepStartTimeRef = useRef<number>(Date.now());
  const previousStepRef = useRef<number>(state.currentStep);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
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
      const timeSpent = Math.floor((Date.now() - stepStartTimeRef.current) / 1000);
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
          console.error('Failed to track wizard step:', error);
        }
      }

      // Reset timer for new step
      stepStartTimeRef.current = Date.now();
    }

    previousStepRef.current = currentStep;
  }, [state.currentStep, state.cvData?.id, userId]);

  const handleStepChange = (step: number) => {
    // If moving forward, validate current step
    if (step > state.currentStep) {
      const currentStepConfig = STEPS[state.currentStep];
      
      if (currentStepConfig.validate && state.cvData) {
        const language = state.cvData.language || 'vi';
        let isValid = false;
        
        // Get the appropriate data for validation
        if (currentStepConfig.id === 2) { // PersonalInfoStep
          const personalInfo = (state.cvData.sections.personal_info || {}) as Record<string, unknown>;
          isValid = (currentStepConfig.validate as (data: Record<string, unknown>, lang: 'vi' | 'en') => boolean)(personalInfo, language);
        } else if (currentStepConfig.id === 4) { // ExperienceStep
          const experience = (state.cvData.sections.experience || []) as Record<string, unknown>[];
          isValid = (currentStepConfig.validate as (data: Record<string, unknown>[], lang: 'vi' | 'en') => boolean)(experience, language);
        } else if (currentStepConfig.id === 5) { // EducationStep
          const education = (state.cvData.sections.education || []) as Record<string, unknown>[];
          isValid = (currentStepConfig.validate as (data: Record<string, unknown>[], lang: 'vi' | 'en') => boolean)(education, language);
        }
        
        if (!isValid) {
          const errorMessages = {
            vi: 'Vui lòng sửa các lỗi trước khi tiếp tục',
            en: 'Please fix the errors before continuing'
          };
          showErrorToast(errorMessages[language], language);
          return;
        }
      }
    }
    
    setCurrentStep(step);
  };

  const CurrentStepComponent = STEPS[state.currentStep]?.component;

  return (
    <div className="h-full flex flex-col">
      {/* Progress Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="heading-feature text-base sm:text-lg text-gray-900 mb-3 sm:mb-4">
          Tạo CV của bạn
        </h2>
        <StepNavigation
          currentStep={state.currentStep}
          totalSteps={STEPS.length}
          onStepChange={handleStepChange}
          stepTitles={STEPS.map(step => step.title)}
        />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {CurrentStepComponent && <CurrentStepComponent />}
      </div>
    </div>
  );
}
