"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faPlus, faCheck } from "@fortawesome/free-solid-svg-icons";
import { upsertVaultSettings } from "@/app/(authenticated)/dashboard/vault/actions";

export interface OptionalSection {
  id: string;
  label: string;
  description: string;
  icon: IconDefinition;
}

interface AddSectionDropdownProps {
  /** Sections that are NOT yet enabled (filtered by parent) */
  availableSections: OptionalSection[];
  /** Called immediately when user picks a section (optimistic) */
  onAdd: (sectionId: string) => void;
  /** Current list — used to build the new list before persisting */
  enabledSections: string[];
}

/**
 * AddSectionDropdown
 * ─────────────────────────────────────────────────────────────────────
 * Nút "+ Thêm mục" cuối tab bar. Bấm mở dropdown liệt kê các optional
 * sections chưa được bật. Bấm chọn → optimistic UI + persist Supabase.
 */
export default function AddSectionDropdown({
  availableSections,
  onAdd,
  enabledSections,
}: AddSectionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, startSave] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Hide button if all optional sections are already enabled
  if (availableSections.length === 0) return null;

  function handleSelect(sectionId: string) {
    setIsOpen(false);
    onAdd(sectionId); // Optimistic update

    // Persist to Supabase in background
    const next = [...enabledSections, sectionId];
    startSave(async () => {
      await upsertVaultSettings(next);
    });
  }

  return (
    <div ref={ref} className="relative shrink-0">
      {/* ── Trigger ── */}
      <button
        id="vault-add-section-btn"
        onClick={() => setIsOpen((v) => !v)}
        className={`
          flex items-center gap-1.5 px-3 py-3 text-sm font-medium rounded-t-lg border-b-2
          transition-all duration-150 whitespace-nowrap
          ${
            isOpen
              ? "border-blue-400 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-400 hover:text-blue-600 hover:border-blue-300"
          }
        `}
        title="Thêm mục vào hồ sơ"
      >
        <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-xs">Thêm mục</span>
      </button>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-200 w-72 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Thêm mục vào hồ sơ
            </p>
          </div>

          <div className="py-1 max-h-80 overflow-y-auto">
            {availableSections.map((section) => (
              <button
                key={section.id}
                id={`add-section-${section.id}`}
                onClick={() => handleSelect(section.id)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
              >
                {/* Icon */}
                <div className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors mt-0.5">
                  <FontAwesomeIcon
                    icon={section.icon}
                    className="w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors"
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {section.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                    {section.description}
                  </p>
                </div>

                {/* Hover checkmark */}
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="w-3.5 h-3.5 text-blue-500"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
