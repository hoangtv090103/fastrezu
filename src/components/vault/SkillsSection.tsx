"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export type SkillsData = {
  hard_skills: string[];
  soft_skills: string[];
  // Legacy field — migrated on load
  items?: string[];
};

interface SkillsSectionProps {
  initialData?: SkillsData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

// ── Tag input sub-component ────────────────────────────────────────────
function TagInput({
  id,
  tags,
  placeholder,
  color,
  onAdd,
  onRemove,
}: {
  id: string;
  tags: string[];
  placeholder: string;
  color: "blue" | "purple";
  onAdd: (raw: string) => void;
  onRemove: (index: number) => void;
}) {
  const [input, setInput] = useState("");

  const tagColors = {
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) {
        onAdd(input);
        setInput("");
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-10 p-3 bg-gray-50 rounded-lg border border-gray-200">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${tagColors[color]}`}
          >
            {tag}
            <button
              id={`remove-${id}-${idx}`}
              onClick={() => onRemove(idx)}
              className="focus:outline-none leading-none opacity-60 hover:opacity-100 transition-opacity"
              aria-label={`Xóa ${tag}`}
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-sm text-gray-400 self-center">
            Chưa có mục nào…
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          id={`${id}-input`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          id={`add-${id}-btn`}
          onClick={() => {
            if (input.trim()) {
              onAdd(input);
              setInput("");
            }
          }}
          disabled={!input.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
        >
          Thêm
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function SkillsSection({
  initialData,
  onSaved,
  onError,
}: SkillsSectionProps) {
  // Migrate legacy `items` → hard_skills on first load
  const [hardSkills, setHardSkills] = useState<string[]>(
    initialData?.hard_skills ?? initialData?.items ?? [],
  );
  const [softSkills, setSoftSkills] = useState<string[]>(
    initialData?.soft_skills ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = (hard: string[], soft: string[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("skills", {
        hard_skills: hard,
        soft_skills: soft,
      } as unknown as Parameters<typeof upsertVaultSection>[1]);
      if (!result.success) {
        const msg = result.error ?? "Lỗi khi lưu";
        setError(msg);
        onError?.(msg);
      } else {
        setError(null);
        onSaved?.();
      }
    });
  };

  const addTag = (list: string[], setList: (v: string[]) => void, raw: string, isHard: boolean) => {
    const tags = raw
      .split(/[,،;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !list.includes(s));
    if (tags.length === 0) return;
    const next = [...list, ...tags];
    setList(next);
    save(isHard ? next : hardSkills, isHard ? softSkills : next);
  };

  const removeTag = (list: string[], setList: (v: string[]) => void, idx: number, isHard: boolean) => {
    const next = list.filter((_, i) => i !== idx);
    setList(next);
    save(isHard ? next : hardSkills, isHard ? softSkills : next);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Nhập kỹ năng rồi bấm{" "}
        <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
          Enter
        </kbd>{" "}
        hoặc dấu phẩy để thêm. AI sẽ dùng danh sách này để tính điểm khớp với JD.
      </p>

      {/* Hard Skills */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">Kỹ năng chuyên môn</p>
          <p className="text-xs text-gray-400">Lập trình, công cụ, ngôn ngữ, framework…</p>
        </div>
        <TagInput
          id="hard-skill"
          tags={hardSkills}
          placeholder="VD: React, Python, SQL, Docker..."
          color="blue"
          onAdd={(raw) => addTag(hardSkills, setHardSkills, raw, true)}
          onRemove={(idx) => removeTag(hardSkills, setHardSkills, idx, true)}
        />
      </div>

      {/* Soft Skills */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-gray-800">Kỹ năng mềm</p>
          <p className="text-xs text-gray-400">Giao tiếp, lãnh đạo, giải quyết vấn đề…</p>
        </div>
        <TagInput
          id="soft-skill"
          tags={softSkills}
          placeholder="VD: Teamwork, Leadership, Critical thinking..."
          color="purple"
          onAdd={(raw) => addTag(softSkills, setSoftSkills, raw, false)}
          onRemove={(idx) => removeTag(softSkills, setSoftSkills, idx, false)}
        />
      </div>

      {isPending && <p className="text-xs text-gray-400">Đang lưu tự động…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
