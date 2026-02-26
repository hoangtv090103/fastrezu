"use client";

import { useState } from "react";
import PersonalInfoForm, { type PersonalInfo } from "./PersonalInfoForm";
import ExperienceSection, { type ExperienceItem } from "./ExperienceSection";
import EducationSection, { type EducationItem } from "./EducationSection";
import SkillsSection, { type SkillsData } from "./SkillsSection";
import SummarySection, { type SummaryData } from "./SummarySection";
import { Toast, useToast } from "@/components/ui/Toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBriefcase,
  faGraduationCap,
  faBolt,
  faBoxArchive,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useTranslation } from "@/hooks/useTranslation";

type TabId = "personal" | "summary" | "experience" | "education" | "skills";

interface VaultData {
  personal?: Partial<PersonalInfo>;
  summary?: SummaryData;
  experience?: { items: ExperienceItem[] };
  education?: { items: EducationItem[] };
  skills?: SkillsData;
}

interface VaultContentProps {
  initialData: VaultData;
}

const TABS: {
  id: TabId;
  label: string;
  icon: IconDefinition;
  description: string;
}[] = [
  {
    id: "personal",
    label: "Thông tin cá nhân",
    icon: faUser,
    description: "Liên lạc, tóm tắt bản thân",
  },
  {
    id: "summary",
    label: "Tóm tắt",
    icon: faFileLines,
    description: "Giới thiệu sự nghiệp gốc — AI dùng làm nền khi viết CV",
  },
  {
    id: "experience",
    label: "Kinh nghiệm",
    icon: faBriefcase,
    description: "Lịch sử làm việc",
  },
  {
    id: "education",
    label: "Học vấn",
    icon: faGraduationCap,
    description: "Trường, chuyên ngành",
  },
  {
    id: "skills",
    label: "Kỹ năng",
    icon: faBolt,
    description: "Hard & soft skills",
  },
];

export default function VaultContent({ initialData }: VaultContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const { toast, show: showToast, dismiss } = useToast();
  const { t } = useTranslation();

  const toastMessages: Record<TabId, string> = {
    personal: "Đã lưu thông tin cá nhân ✓",
    summary: "Đã lưu tóm tắt sự nghiệp ✓",
    experience: "Đã lưu kinh nghiệm ✓",
    education: "Đã lưu học vấn ✓",
    skills: "Đã lưu kỹ năng ✓",
  };

  const handleSaved = (tab: TabId) => showToast(toastMessages[tab]);
  const handleError = (msg: string) => showToast(msg, "error");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 heading-feature flex items-center gap-2">
          <FontAwesomeIcon
            icon={faBoxArchive}
            className="text-blue-600 w-6 h-6"
          />
          {t("dashboard.theVault")}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Nhập liệu một lần, FastRezu AI sẽ dùng để tạo CV khớp với mọi JD. Dữ
          liệu được lưu tự động khi bạn chỉnh sửa.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-1 overflow-x-auto pb-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`vault-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-150 whitespace-nowrap
                ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <span>
                <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
              </span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab description */}
      <p className="text-xs text-gray-400 mb-5">
        {TABS.find((t) => t.id === activeTab)?.description}
      </p>

      {/* Tab panels */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {activeTab === "personal" && (
          <PersonalInfoForm
            initialData={initialData.personal}
            onSaved={() => handleSaved("personal")}
            onError={handleError}
          />
        )}
        {activeTab === "summary" && (
          <SummarySection
            initialData={initialData.summary}
            experienceItems={
              initialData.experience?.items as
                | Record<string, unknown>[]
                | undefined
            }
            skills={initialData.skills?.items}
            onSaved={() => handleSaved("summary")}
            onError={handleError}
          />
        )}
        {activeTab === "experience" && (
          <ExperienceSection
            initialData={initialData.experience}
            onSaved={() => handleSaved("experience")}
            onError={handleError}
          />
        )}
        {activeTab === "education" && (
          <EducationSection
            initialData={initialData.education}
            onSaved={() => handleSaved("education")}
            onError={handleError}
          />
        )}
        {activeTab === "skills" && (
          <SkillsSection
            initialData={initialData.skills}
            onSaved={() => handleSaved("skills")}
            onError={handleError}
          />
        )}
      </div>

      {/* Footer hint */}
      <p className="text-center text-xs text-gray-400 mt-6">
        Dữ liệu được lưu trên Supabase và không bao giờ chia sẻ với bên thứ ba.
      </p>

      {/* Global Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />
      )}
    </div>
  );
}
