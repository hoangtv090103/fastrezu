"use client";

import { useState } from "react";
import PersonalInfoForm, { type PersonalInfo } from "./PersonalInfoForm";
import ExperienceSection, { type ExperienceItem } from "./ExperienceSection";
import EducationSection, { type EducationItem } from "./EducationSection";
import SkillsSection, { type SkillsData } from "./SkillsSection";
import SummarySection, { type SummaryData } from "./SummarySection";
import ProjectsSection, { type ProjectsData } from "./ProjectsSection";
import CertificationsSection, {
  type CertificationsData,
} from "./CertificationsSection";
import AwardsSection, { type AwardsData } from "./AwardsSection";
import VolunteeringSection, {
  type VolunteeringData,
} from "./VolunteeringSection";
import HobbiesSection, { type HobbiesData } from "./HobbiesSection";
import ReferencesSection, { type ReferencesData } from "./ReferencesSection";
import PublicationsSection, {
  type PublicationsData,
} from "./PublicationsSection";
import { Toast, useToast } from "@/components/ui/Toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faBriefcase,
  faGraduationCap,
  faBolt,
  faBoxArchive,
  faFileLines,
  faCode,
  faCertificate,
  faPlus,
  faCheck,
  faXmark,
  faTrophy,
  faHandshake,
  faHeart,
  faAddressCard,
  faBook,
  faFileImport,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { upsertVaultSettings } from "@/app/(authenticated)/dashboard/vault/actions";
import { useEffect, useRef, useTransition } from "react";

// ── Types ─────────────────────────────────────────────────────────────
type TabId =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "awards"
  | "volunteering"
  | "hobbies"
  | "references"
  | "publications";

interface VaultData {
  personal?: Partial<PersonalInfo>;
  summary?: SummaryData;
  experience?: { items: ExperienceItem[] };
  education?: { items: EducationItem[] };
  skills?: SkillsData;
  projects?: ProjectsData;
  certifications?: CertificationsData;
  awards?: AwardsData;
  volunteering?: VolunteeringData;
  hobbies?: HobbiesData;
  references?: ReferencesData;
  publications?: PublicationsData;
}

interface VaultContentProps {
  initialData: VaultData;
  initialEnabledSections?: string[];
}

// ── Tab definitions ───────────────────────────────────────────────────
const getTabDefs = (
  t: (key: string, variables?: Record<string, string | number>) => string,
): {
  id: TabId;
  label: string;
  icon: IconDefinition;
  description: string;
  optional: boolean;
  badge?: string;
}[] => [
  {
    id: "personal",
    label: t("vault.tabs.personal.label"),
    icon: faUser,
    description: t("vault.tabs.personal.desc"),
    optional: false,
  },
  {
    id: "summary",
    label: t("vault.tabs.summary.label"),
    icon: faFileLines,
    description: t("vault.tabs.summary.desc"),
    optional: false,
    badge: "AI",
  },
  {
    id: "experience",
    label: t("vault.tabs.experience.label"),
    icon: faBriefcase,
    description: t("vault.tabs.experience.desc"),
    optional: false,
  },
  {
    id: "education",
    label: t("vault.tabs.education.label"),
    icon: faGraduationCap,
    description: t("vault.tabs.education.desc"),
    optional: false,
  },
  {
    id: "skills",
    label: t("vault.tabs.skills.label"),
    icon: faBolt,
    description: t("vault.tabs.skills.desc"),
    optional: false,
  },
  // ── Optional (ẩn mặc định) ──
  {
    id: "projects",
    label: t("vault.tabs.projects.label"),
    icon: faCode,
    description: t("vault.tabs.projects.desc"),
    optional: true,
  },
  {
    id: "certifications",
    label: t("vault.tabs.certifications.label"),
    icon: faCertificate,
    description: t("vault.tabs.certifications.desc"),
    optional: true,
  },
  {
    id: "awards",
    label: t("vault.tabs.awards.label"),
    icon: faTrophy,
    description: t("vault.tabs.awards.desc"),
    optional: true,
  },
  {
    id: "volunteering",
    label: t("vault.tabs.volunteering.label"),
    icon: faHandshake,
    description: t("vault.tabs.volunteering.desc"),
    optional: true,
  },
  {
    id: "hobbies",
    label: t("vault.tabs.hobbies.label"),
    icon: faHeart,
    description: t("vault.tabs.hobbies.desc"),
    optional: true,
  },
  {
    id: "references",
    label: t("vault.tabs.references.label"),
    icon: faAddressCard,
    description: t("vault.tabs.references.desc"),
    optional: true,
  },
  {
    id: "publications",
    label: t("vault.tabs.publications.label"),
    icon: faBook,
    description: t("vault.tabs.publications.desc"),
    optional: true,
  },
];

// ── AddSection inline panel (shown in sidebar) ────────────────────────
function AddSectionPanel({
  available,
  onAdd,
  enabledSections,
  t,
}: {
  available: ReturnType<typeof getTabDefs>;
  onAdd: (id: string) => void;
  enabledSections: string[];
  t: (key: string, variables?: Record<string, string | number>) => string;
}) {
  const [open, setOpen] = useState(false);
  const [, startSave] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (available.length === 0) return null;

  function handleSelect(id: string) {
    setOpen(false);
    onAdd(id);
    const next = [...enabledSections, id];
    startSave(async () => {
      await upsertVaultSettings(next);
    });
  }

  return (
    <div ref={ref} className="relative mt-1">
      <button
        id="vault-add-section-btn"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors border-2 border-dashed
          ${
            open
              ? "border-blue-400 bg-blue-50 text-blue-700"
              : "border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50"
          }`}
      >
        <span className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
        </span>
        <span className="font-medium">{t("vault.addSection")}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-gray-200 w-64 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {t("vault.selectSectionToAdd")}
            </p>
          </div>
          <div className="py-1 max-h-64 overflow-y-auto">
            {available.map((tab) => (
              <button
                key={tab.id}
                id={`add-section-${tab.id}`}
                onClick={() => handleSelect(tab.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left group"
              >
                <span className="w-7 h-7 rounded-md bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                  <FontAwesomeIcon
                    icon={tab.icon}
                    className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-600 transition-colors"
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {tab.label}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {tab.description}
                  </p>
                </div>
                <FontAwesomeIcon
                  icon={faCheck}
                  className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function VaultContent({
  initialData,
  initialEnabledSections = [],
}: VaultContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const { toast, show: showToast, dismiss } = useToast();
  const { t } = useTranslation();
  const [enabledSections, setEnabledSections] = useState<string[]>(
    initialEnabledSections,
  );
  const [, startTransition] = useTransition();

  const TAB_DEFS = getTabDefs(t);

  const visibleTabs = TAB_DEFS.filter(
    (tab) => !tab.optional || enabledSections.includes(tab.id),
  );
  const availableToAdd = TAB_DEFS.filter(
    (tab) => tab.optional && !enabledSections.includes(tab.id),
  );

  function handleAddSection(sectionId: string) {
    setEnabledSections((prev) => [...prev, sectionId]);
    setActiveTab(sectionId as TabId);
  }

  function handleRemoveSection(sectionId: string) {
    const next = enabledSections.filter((id) => id !== sectionId);
    setEnabledSections(next);
    if (activeTab === sectionId) setActiveTab("personal");
    startTransition(async () => {
      await upsertVaultSettings(next);
    });
  }

  const toastMessages: Record<TabId, string> = {
    personal: t("vault.toastSaved.personal"),
    summary: t("vault.toastSaved.summary"),
    experience: t("vault.toastSaved.experience"),
    education: t("vault.toastSaved.education"),
    skills: t("vault.toastSaved.skills"),
    projects: t("vault.toastSaved.projects"),
    certifications: t("vault.toastSaved.certifications"),
    awards: t("vault.toastSaved.awards"),
    volunteering: t("vault.toastSaved.volunteering"),
    hobbies: t("vault.toastSaved.hobbies"),
    references: t("vault.toastSaved.references"),
    publications: t("vault.toastSaved.publications"),
  };

  const handleSaved = (tab: TabId) => showToast(toastMessages[tab]);
  const handleError = (msg: string) => showToast(msg, "error");

  const activeTabDef = TAB_DEFS.find((t) => t.id === activeTab);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 heading-feature flex items-center gap-2.5">
            <FontAwesomeIcon
              icon={faBoxArchive}
              className="text-blue-600 w-6 h-6"
            />
            {t("dashboard.theVault")}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{t("vault.subtitle")}</p>
        </div>
        <Link
          href="/dashboard/scanner"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
        >
          <FontAwesomeIcon icon={faFileImport} className="w-4 h-4" />
          {t("vault.importFromCV")}
        </Link>
      </div>

      {/* ── Sidebar + Content ── */}
      <div className="flex gap-6 items-start">
        {/* ── LEFT: Sidebar ── */}
        <aside className="w-56 shrink-0 sticky top-20">
          <nav className="space-y-0.5">
            {/* Required tabs group */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
              {t("vault.basicProfile")}
            </p>
            {visibleTabs
              .filter((t) => !t.optional)
              .map((tab) => (
                <SidebarItem
                  key={tab.id}
                  tab={tab}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}

            {/* Optional tabs group */}
            {visibleTabs.some((t) => t.optional) && (
              <>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mt-4 mb-2 pt-2 border-t border-gray-100">
                  {t("vault.additionalSections")}
                </p>
                {visibleTabs
                  .filter((t) => t.optional)
                  .map((tab) => (
                    <SidebarItem
                      key={tab.id}
                      tab={tab}
                      active={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      onRemove={() => handleRemoveSection(tab.id)}
                    />
                  ))}
              </>
            )}

            {/* Add section */}
            <div
              className={
                visibleTabs.some((t) => t.optional)
                  ? "mt-2"
                  : "mt-4 pt-2 border-t border-gray-100"
              }
            >
              <AddSectionPanel
                available={availableToAdd}
                onAdd={handleAddSection}
                enabledSections={enabledSections}
                t={t}
              />
            </div>
          </nav>

          {/* Storage note */}
          <p className="text-[11px] text-gray-400 mt-6 px-1 leading-relaxed">
            {t("vault.securityNote")}
          </p>
        </aside>

        {/* ── RIGHT: Content panel ── */}
        <div className="flex-1 min-w-0">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              {activeTabDef && (
                <FontAwesomeIcon
                  icon={activeTabDef.icon}
                  className="w-4 h-4 text-blue-600"
                />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {activeTabDef?.label}
              </h2>
              <p className="text-xs text-gray-400">
                {activeTabDef?.description}
              </p>
            </div>
            {activeTabDef?.badge && (
              <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white">
                {activeTabDef.badge}
              </span>
            )}
          </div>

          {/* Panel card */}
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
                skills={[
                  ...(initialData.skills?.hard_skills ??
                    initialData.skills?.items ??
                    []),
                  ...(initialData.skills?.soft_skills ?? []),
                ]}
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
            {activeTab === "projects" && (
              <ProjectsSection
                initialData={initialData.projects}
                onSaved={() => handleSaved("projects")}
                onError={handleError}
              />
            )}
            {activeTab === "certifications" && (
              <CertificationsSection
                initialData={initialData.certifications}
                onSaved={() => handleSaved("certifications")}
                onError={handleError}
              />
            )}
            {activeTab === "awards" && (
              <AwardsSection
                initialData={initialData.awards}
                onSaved={() => handleSaved("awards")}
                onError={handleError}
              />
            )}
            {activeTab === "volunteering" && (
              <VolunteeringSection
                initialData={initialData.volunteering}
                onSaved={() => handleSaved("volunteering")}
                onError={handleError}
              />
            )}
            {activeTab === "hobbies" && (
              <HobbiesSection
                initialData={initialData.hobbies}
                onSaved={() => handleSaved("hobbies")}
                onError={handleError}
              />
            )}
            {activeTab === "references" && (
              <ReferencesSection
                initialData={initialData.references}
                onSaved={() => handleSaved("references")}
                onError={handleError}
              />
            )}
            {activeTab === "publications" && (
              <PublicationsSection
                initialData={initialData.publications}
                onSaved={() => handleSaved("publications")}
                onError={handleError}
              />
            )}
          </div>
        </div>
      </div>

      {/* Global Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />
      )}
    </div>
  );
}

// ── Sidebar Item ─────────────────────────────────────────────────────
function SidebarItem({
  tab,
  active,
  onClick,
  onRemove,
}: {
  tab: ReturnType<typeof getTabDefs>[0];
  active: boolean;
  onClick: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="relative group/item">
      <button
        id={`vault-tab-${tab.id}`}
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group
          ${
            active
              ? "bg-blue-50 text-blue-700 font-semibold"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
          }`}
      >
        <span
          className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors
            ${active ? "bg-blue-100" : "bg-gray-100 group-hover:bg-gray-200"}`}
        >
          <FontAwesomeIcon
            icon={tab.icon}
            className={`w-3.5 h-3.5 ${active ? "text-blue-600" : "text-gray-500"}`}
          />
        </span>
        <span className="flex-1 text-left leading-tight">{tab.label}</span>
      </button>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-red-100 transition-all"
        >
          <FontAwesomeIcon icon={faXmark} className="w-3 h-3 text-red-400" />
        </button>
      )}
    </div>
  );
}
