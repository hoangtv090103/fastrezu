"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export type SkillsData = {
  items: string[];
};

interface SkillsSectionProps {
  initialData?: SkillsData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

export default function SkillsSection({
  initialData,
  onSaved,
  onError,
}: SkillsSectionProps) {
  const [skills, setSkills] = useState<string[]>(initialData?.items ?? []);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveSkills = (newSkills: string[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("skills", { items: newSkills });
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

  const addSkill = (raw: string) => {
    const tags = raw
      .split(/[,،;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !skills.includes(s));
    if (tags.length === 0) return;
    const next = [...skills, ...tags];
    setSkills(next);
    setInput("");
    saveSkills(next);
  };

  const removeSkill = (index: number) => {
    const next = skills.filter((_, i) => i !== index);
    setSkills(next);
    saveSkills(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(input);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Nhập kỹ năng rồi bấm{" "}
        <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
          Enter
        </kbd>{" "}
        hoặc dấu phẩy để thêm. AI sẽ dùng danh sách này để tính điểm khớp với
        JD.
      </p>

      {/* Tag list */}
      <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-gray-50 rounded-lg border border-gray-200">
        {skills.map((skill, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
          >
            {skill}
            <button
              id={`remove-skill-${idx}`}
              onClick={() => removeSkill(idx)}
              className="hover:text-blue-600 focus:outline-none leading-none opacity-60 hover:opacity-100 transition-opacity"
              aria-label={`Xóa ${skill}`}
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
            </button>
          </span>
        ))}
        {skills.length === 0 && (
          <span className="text-sm text-gray-400 self-center">
            Chưa có kỹ năng nào…
          </span>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          id="skill-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="VD: React, TypeScript, Node.js..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          id="add-skill-btn"
          onClick={() => addSkill(input)}
          disabled={!input.trim() || isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
        >
          Thêm
        </button>
      </div>

      {isPending && <p className="text-xs text-gray-400">Đang lưu tự động…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
