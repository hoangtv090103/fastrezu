"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faTrophy } from "@fortawesome/free-solid-svg-icons";

// ── Types ──────────────────────────────────────────────────────────────
export interface AwardItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
  description: string;
}

export type AwardsData = {
  items: AwardItem[];
};

interface AwardsSectionProps {
  initialData?: AwardsData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────
const blankItem = (): AwardItem => ({
  id: crypto.randomUUID(),
  name: "",
  issuer: "",
  year: "",
  description: "",
});

// ── Component ──────────────────────────────────────────────────────────
export default function AwardsSection({
  initialData,
  onSaved,
  onError,
}: AwardsSectionProps) {
  const [items, setItems] = useState<AwardItem[]>(initialData?.items ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AwardItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Persist ────────────────────────────────────────────────────────
  const saveAll = (newItems: AwardItem[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("awards", {
        items: newItems,
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

  // ── Actions ────────────────────────────────────────────────────────
  const handleAddNew = () => {
    const item = blankItem();
    setDraft(item);
    setEditingId(item.id);
  };

  const handleEdit = (item: AwardItem) => {
    setDraft({ ...item });
    setEditingId(item.id);
  };

  const handleDraftChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!draft) return;
    setDraft({ ...draft, [e.target.name]: e.target.value });
  };

  const handleSaveDraft = () => {
    if (!draft || !draft.name.trim()) return;
    const exists = items.some((i) => i.id === draft.id);
    const next = exists
      ? items.map((i) => (i.id === draft.id ? draft : i))
      : [draft, ...items];
    setItems(next);
    setEditingId(null);
    setDraft(null);
    saveAll(next);
  };

  const handleCancelDraft = () => {
    setEditingId(null);
    setDraft(null);
  };

  const handleDelete = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    saveAll(next);
  };

  // ── Styles ─────────────────────────────────────────────────────────
  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  // ── Inline edit form ───────────────────────────────────────────────
  const renderForm = (p: AwardItem) => (
    <div className="border border-blue-300 bg-blue-50 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tên giải thưởng *</label>
          <input
            name="name"
            value={p.name}
            onChange={handleDraftChange}
            placeholder="Sinh viên xuất sắc, Best Paper Award..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tổ chức trao</label>
          <input
            name="issuer"
            value={p.issuer}
            onChange={handleDraftChange}
            placeholder="Đại học Bách Khoa, IEEE..."
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Năm nhận</label>
        <input
          name="year"
          value={p.year}
          onChange={handleDraftChange}
          placeholder="2024"
          maxLength={4}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Mô tả ngắn</label>
        <textarea
          name="description"
          value={p.description}
          onChange={handleDraftChange}
          placeholder="Mô tả thành tích hoặc lý do nhận giải..."
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          id={`save-award-${p.id}`}
          onClick={handleSaveDraft}
          disabled={isPending || !p.name.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
        >
          {isPending ? "Đang lưu…" : "Lưu"}
        </button>
        <button
          onClick={handleCancelDraft}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Hủy
        </button>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {editingId === null ? (
        <button
          id="add-award-btn"
          onClick={handleAddNew}
          className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 text-sm text-gray-500 hover:text-blue-600 rounded-xl transition-colors font-medium"
        >
          + Thêm giải thưởng
        </button>
      ) : draft && !items.some((i) => i.id === draft.id) ? (
        renderForm(draft)
      ) : null}

      {items.length === 0 && editingId === null && (
        <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          Chưa có giải thưởng nào. Bấm &ldquo;+ Thêm giải thưởng&rdquo; để bắt
          đầu.
        </p>
      )}

      {items.map((item) =>
        editingId === item.id && draft ? (
          <div key={item.id}>{renderForm(draft)}</div>
        ) : (
          <div
            key={item.id}
            className="border border-gray-200 bg-white rounded-xl p-4 flex items-start gap-4 group hover:border-blue-200 transition-colors"
          >
            <div className="shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
              <FontAwesomeIcon
                icon={faTrophy}
                className="w-4 h-4 text-amber-600"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-600">
                {[item.issuer, item.year].filter(Boolean).join(" · ")}
              </p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                id={`edit-award-${item.id}`}
                onClick={() => handleEdit(item)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Sửa"
              >
                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
              </button>
              <button
                id={`delete-award-${item.id}`}
                onClick={() => handleDelete(item.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa"
              >
                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
              </button>
            </div>
          </div>
        ),
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
