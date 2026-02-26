"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import SmartTextarea from "@/components/ui/SmartTextarea";
import AIAssistButton from "@/components/ui/AIAssistButton";

export interface SummaryData {
  content: string;
}

interface SummarySectionProps {
  initialData?: SummaryData;
  experienceItems?: Record<string, unknown>[];
  skills?: string[];
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

const MAX_CHARS = 800;
const TARGET_MIN = 300;
const TARGET_MAX = 600;

export default function SummarySection({
  initialData,
  experienceItems = [],
  skills = [],
  onSaved,
  onError,
}: SummarySectionProps) {
  const [text, setText] = useState(initialData?.content ?? "");
  const [isSaving, startSaving] = useTransition();
  const [isDrafting, startDrafting] = useTransition();

  const charCount = text.length;
  const isGood = charCount >= TARGET_MIN && charCount <= TARGET_MAX;
  const isTooLong = charCount > MAX_CHARS;

  function handleSave() {
    if (!text.trim()) return;
    startSaving(async () => {
      const result = await upsertVaultSection("summary", { content: text });
      if (result.success) {
        onSaved?.();
      } else {
        onError?.(result.error ?? "Lỗi không xác định khi lưu");
      }
    });
  }

  function handleAIDraft() {
    startDrafting(async () => {
      try {
        const res = await fetch("/api/vault/generate-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            experience: experienceItems,
            skills,
            language: "vi",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          onError?.(data.error ?? "AI không phản hồi được");
          return;
        }

        setText(data.summary ?? "");
      } catch {
        onError?.("Lỗi kết nối khi gọi AI. Vui lòng thử lại.");
      }
    });
  }
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          Tóm tắt sự nghiệp
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Đoạn giới thiệu 3–4 câu về điểm mạnh và chuyên môn của bạn. AI sẽ dùng
          đây làm nền để viết Summary cho từng CV theo JD cụ thể.
        </p>
      </div>

      {/* SmartTextarea with AI glow effect */}
      <SmartTextarea
        id="vault-summary-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_CHARS}
        rows={6}
        isRewriting={isDrafting}
        placeholder="Ví dụ: Kỹ sư phần mềm với hơn 3 năm kinh nghiệm phát triển ứng dụng web sử dụng React và Node.js. Có kinh nghiệm thiết kế hệ thống RESTful API hiệu suất cao và triển khai CI/CD. Đam mê xây dựng sản phẩm hướng người dùng và tối ưu trải nghiệm kỹ thuật trong môi trường Agile."
        className="h-40"
      />

      {/* Char counter + hint */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {isGood
            ? "✓ Độ dài lý tưởng (300–600 ký tự)"
            : charCount < TARGET_MIN
              ? `Còn ${TARGET_MIN - charCount} ký tự để đạt độ dài khuyến nghị`
              : `Nên rút gọn xuống dưới ${TARGET_MAX} ký tự`}
        </p>
        <span
          className={`text-xs font-medium tabular-nums ${
            isTooLong
              ? "text-red-500"
              : isGood
                ? "text-green-600"
                : "text-gray-400"
          }`}
        >
          {charCount} / {MAX_CHARS}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3">
        {/* AI Draft — dùng AIAssistButton giống CVEditor */}
        <AIAssistButton
          id="vault-summary-ai-draft"
          onClick={handleAIDraft}
          loading={isDrafting}
          label="AI gợi ý"
          disabled={false}
        />

        {/* Save */}
        <button
          id="vault-summary-save"
          onClick={handleSave}
          disabled={isSaving || !text.trim() || isTooLong}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <FontAwesomeIcon
                icon={faCircleNotch}
                className="w-4 h-4 animate-spin"
              />
              Đang lưu...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
              Lưu tóm tắt
            </>
          )}
        </button>
      </div>
    </div>
  );
}
