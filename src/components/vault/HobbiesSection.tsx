"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export type HobbiesData = {
  items: string[];
};

interface HobbiesSectionProps {
  initialData?: HobbiesData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

export default function HobbiesSection({
  initialData,
  onSaved,
  onError,
}: HobbiesSectionProps) {
  const [hobbies, setHobbies] = useState<string[]>(initialData?.items ?? []);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveHobbies = (newHobbies: string[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("hobbies", {
        items: newHobbies,
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

  const addHobby = (raw: string) => {
    const tags = raw
      .split(/[,،;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !hobbies.includes(s));
    if (tags.length === 0) return;
    const next = [...hobbies, ...tags];
    setHobbies(next);
    setInput("");
    saveHobbies(next);
  };

  const removeHobby = (index: number) => {
    const next = hobbies.filter((_, i) => i !== index);
    setHobbies(next);
    saveHobbies(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addHobby(input);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Nhập sở thích rồi bấm{" "}
        <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
          Enter
        </kbd>{" "}
        hoặc dấu phẩy để thêm. Sở thích giúp thể hiện cá tính và culture fit với nhà tuyển dụng.
      </p>

      <div className="flex flex-wrap gap-2 min-h-12 p-3 bg-gray-50 rounded-lg border border-gray-200">
        {hobbies.map((hobby, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-100 text-pink-800 text-sm font-medium rounded-full"
          >
            {hobby}
            <button
              id={`remove-hobby-${idx}`}
              onClick={() => removeHobby(idx)}
              className="hover:text-pink-600 focus:outline-none leading-none opacity-60 hover:opacity-100 transition-opacity"
              aria-label={`Xóa ${hobby}`}
            >
              <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
            </button>
          </span>
        ))}
        {hobbies.length === 0 && (
          <span className="text-sm text-gray-400 self-center">
            Chưa có sở thích nào…
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          id="hobby-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="VD: Đọc sách, Chạy bộ, Nhiếp ảnh..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          id="add-hobby-btn"
          onClick={() => addHobby(input)}
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
