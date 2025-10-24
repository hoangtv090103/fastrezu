"use client";

import { useCVEditor } from "@/contexts/CVEditorContext";
import StepNavigation from "@/components/editor/StepNavigation";
import LanguageSelectionStep from "@/components/editor/steps/LanguageSelectionStep";
import JDAnalysisStep from "@/components/editor/steps/JDAnalysisStep";
import PersonalInfoStep from "@/components/editor/steps/PersonalInfoStep";
import SummaryStep from "@/components/editor/steps/SummaryStep";
import ExperienceStep from "@/components/editor/steps/ExperienceStep";
import EducationStep from "@/components/editor/steps/EducationStep";
import ProjectsStep from "@/components/editor/steps/ProjectsStep";
import SkillsStep from "@/components/editor/steps/SkillsStep";
import CertificationsStep from "@/components/editor/steps/CertificationsStep";
import ReviewStep from "@/components/editor/steps/ReviewStep";

const STEPS = [
  { id: 0, title: "Ngôn ngữ", component: LanguageSelectionStep },
  { id: 1, title: "JD", component: JDAnalysisStep },
  { id: 2, title: "Thông tin", component: PersonalInfoStep },
  { id: 3, title: "Nghề nghiệp", component: SummaryStep },
  { id: 4, title: "Kinh nghiệm", component: ExperienceStep },
  { id: 5, title: "Học vấn", component: EducationStep },
  { id: 6, title: "Dự án", component: ProjectsStep },
  { id: 7, title: "Kỹ năng", component: SkillsStep },
  { id: 8, title: "Chứng chỉ", component: CertificationsStep },
  { id: 9, title: "Review", component: ReviewStep },
];

export default function WizardPanel() {
  const { state, setCurrentStep } = useCVEditor();

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const CurrentStepComponent = STEPS[state.currentStep]?.component;

  return (
    <div className="h-full flex flex-col">
      {/* Progress Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="heading-feature text-lg text-gray-900 mb-4">
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
