"use client";

import { useCVEditor } from "@/contexts/CVEditorContext";
import StepNavigation from "@/components/editor/StepNavigation";
import JDAnalysisStep from "@/components/editor/steps/JDAnalysisStep";
import PersonalInfoStep from "@/components/editor/steps/PersonalInfoStep";
import SummaryStep from "@/components/editor/steps/SummaryStep";
import ExperienceStep from "@/components/editor/steps/ExperienceStep";
import EducationStep from "@/components/editor/steps/EducationStep";
import ProjectsStep from "@/components/editor/steps/ProjectsStep";
import SkillsStep from "@/components/editor/steps/SkillsStep";
import CertificationsStep from "@/components/editor/steps/CertificationsStep";

const STEPS = [
  { id: 0, title: "Phân tích JD", component: JDAnalysisStep },
  { id: 1, title: "Thông tin cá nhân", component: PersonalInfoStep },
  { id: 2, title: "Tóm tắt nghề nghiệp", component: SummaryStep },
  { id: 3, title: "Kinh nghiệm làm việc", component: ExperienceStep },
  { id: 4, title: "Học vấn", component: EducationStep },
  { id: 5, title: "Dự án", component: ProjectsStep },
  { id: 6, title: "Kỹ năng", component: SkillsStep },
  { id: 7, title: "Chứng chỉ", component: CertificationsStep },
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
        />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {CurrentStepComponent && <CurrentStepComponent />}
      </div>
    </div>
  );
}
