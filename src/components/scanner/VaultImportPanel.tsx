"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVault,
  faCheck,
  faCircleExclamation,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  upsertVaultSection,
  upsertVaultSettings,
} from "@/app/(authenticated)/dashboard/vault/actions";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import type { ExtractedProfile } from "@/app/api/ai/extract-profile-from-cv/route";
import type { Json } from "@/types/database.types";

// Sections supported for import, in display order
const IMPORT_SECTIONS = [
  "personal",
  "summary",
  "experience",
  "education",
  "skills",
  "certifications",
  "projects",
  "awards",
  "volunteering",
  "hobbies",
  "references",
  "publications",
] as const;
type ImportSection = (typeof IMPORT_SECTIONS)[number];

// Optional vault sections that must be enabled in vault_settings after import
const OPTIONAL_SECTIONS: ImportSection[] = [
  "certifications",
  "projects",
  "awards",
  "volunteering",
  "hobbies",
  "references",
  "publications",
];

interface Props {
  extractedProfile: ExtractedProfile;
  /** Keys that already exist in the user's vault (even if empty object) */
  existingVaultSections: Record<string, unknown>;
  /** Already-enabled optional sections (e.g. ["projects", "certifications"]) */
  existingEnabledSections: string[];
}

function hasContent(data: unknown): boolean {
  if (data == null) return false;
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // Array-based sections: items may be objects (experience, projects…) or
    // plain strings (hobbies) — both cases just need a non-empty array
    if (Array.isArray(obj.items)) return obj.items.length > 0;
    // Skills section
    if (Array.isArray(obj.hard_skills) || Array.isArray(obj.soft_skills)) {
      return (
        (obj.hard_skills as string[])?.length > 0 ||
        (obj.soft_skills as string[])?.length > 0
      );
    }
    // personal / summary — at least one non-empty string field
    return Object.values(obj).some(
      (v) => typeof v === "string" && v.trim().length > 0,
    );
  }
  return false;
}

function getItemCount(section: ImportSection, profile: ExtractedProfile): number | null {
  const data = profile[section];
  if (data == null) return null;
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.items)) return (obj.items as unknown[]).length;
  return null;
}

export default function VaultImportPanel({
  extractedProfile,
  existingVaultSections,
  existingEnabledSections,
}: Props) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  // Initial checked state:
  // - Extracted and no existing data → checked
  // - Extracted and has existing data → unchecked (and disabled to avoid overwrite)
  const initialChecked = Object.fromEntries(
    IMPORT_SECTIONS.map((sec) => {
      const extracted = extractedProfile[sec];
      const alreadyHasData = hasContent(existingVaultSections[sec]);
      const isExtracted = hasContent(extracted);
      return [sec, isExtracted && !alreadyHasData];
    }),
  ) as Record<ImportSection, boolean>;

  const [checked, setChecked] = useState<Record<ImportSection, boolean>>(initialChecked);
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [error, setError] = useState("");

  const toggleSection = (sec: ImportSection) => {
    setChecked((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError("");

    const sectionsToImport = IMPORT_SECTIONS.filter((sec) => checked[sec]);
    const newOptionalSections: string[] = [];

    try {
      await Promise.all(
        sectionsToImport.map(async (sec) => {
          const content = extractedProfile[sec];
          if (!content) return;
          const result = await upsertVaultSection(sec, content as Json);
          if (!result.success) throw new Error(result.error ?? `Failed to import ${sec}`);

          // Track optional sections that need to be enabled in vault_settings
          if (OPTIONAL_SECTIONS.includes(sec)) {
            newOptionalSections.push(sec);
          }
        }),
      );

      // Enable any newly imported optional sections in vault_settings
      if (newOptionalSections.length > 0) {
        const merged = Array.from(
          new Set([...existingEnabledSections, ...newOptionalSections]),
        );
        await upsertVaultSettings(merged);
      }

      setImportDone(true);
      showSuccessToast(t("scanner.importPanel.importSuccess"));
      setTimeout(() => router.push("/dashboard/vault"), 1500);
    } catch (err) {
      showErrorToast(err, locale);
      setError(
        err instanceof Error ? err.message : t("scanner.importPanel.importError"),
      );
    } finally {
      setIsImporting(false);
    }
  };

  const anyChecked = IMPORT_SECTIONS.some((sec) => checked[sec]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <FontAwesomeIcon icon={faVault} className="text-indigo-500 w-5 h-5" />
        <h2 className="text-lg font-bold text-gray-900">
          {t("scanner.importPanel.title")}
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {t("scanner.importPanel.subtitle")}
      </p>

      {/* Section checkboxes */}
      <div className="space-y-3 mb-6">
        {IMPORT_SECTIONS.map((sec) => {
          const extracted = extractedProfile[sec];
          const hasExtracted = hasContent(extracted);
          const alreadyHasData = hasContent(existingVaultSections[sec]);
          const itemCount = getItemCount(sec, extractedProfile);
          const isNoData = !hasExtracted;
          const isExisting = alreadyHasData;
          const isDisabled = isNoData || isExisting;

          return (
            <label
              key={sec}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                isNoData
                  ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-100"
                  : isExisting
                    ? "opacity-70 cursor-not-allowed border-amber-200 bg-amber-50"
                    : checked[sec]
                      ? "cursor-pointer border-indigo-300 bg-indigo-50"
                      : "cursor-pointer border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={!!checked[sec]}
                disabled={isDisabled}
                onChange={() => toggleSection(sec)}
                className="mt-0.5 w-4 h-4 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-medium ${
                      !hasExtracted ? "text-gray-400" : "text-gray-800"
                    }`}
                  >
                    {t(`scanner.importPanel.sections.${sec}`)}
                  </span>

                  {/* Badges */}
                  {!hasExtracted && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                      {t("scanner.importPanel.noDataExtracted")}
                    </span>
                  )}
                  {hasExtracted && alreadyHasData && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" />
                      {t("scanner.importPanel.hasExistingData")}
                    </span>
                  )}
                  {hasExtracted && itemCount != null && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                      {t("scanner.importPanel.itemsFound", {
                        count: itemCount.toString(),
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Check indicator */}
              {hasExtracted && checked[sec] && (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-indigo-500 w-4 h-4 mt-0.5 flex-shrink-0"
                />
              )}
            </label>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success */}
      {importDone && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <FontAwesomeIcon icon={faCheck} className="text-green-500 w-4 h-4" />
          <p className="text-sm text-green-700 font-medium">
            {t("scanner.importPanel.importSuccess")}
          </p>
        </div>
      )}

      {/* Import button */}
      <button
        onClick={handleImport}
        disabled={!anyChecked || isImporting || importDone}
        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {isImporting && (
          <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
        )}
        {isImporting
          ? t("scanner.importPanel.importing")
          : t("scanner.importPanel.importButton")}
      </button>
    </div>
  );
}
