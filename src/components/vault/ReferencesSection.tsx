"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrash,
  faAddressCard,
} from "@fortawesome/free-solid-svg-icons";

// ── Types ──────────────────────────────────────────────────────────────
export interface ReferenceItem {
  id: string;
  name: string;
  title: string;
  organization: string;
  email: string;
  phone: string;
  relationship: string;
}

export type ReferencesData = {
  items: ReferenceItem[];
};

interface ReferencesSectionProps {
  initialData?: ReferencesData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────
const blankItem = (): ReferenceItem => ({
  id: crypto.randomUUID(),
  name: "",
  title: "",
  organization: "",
  email: "",
  phone: "",
  relationship: "",
});

// ── Component ──────────────────────────────────────────────────────────
export default function ReferencesSection({
  initialData,
  onSaved,
  onError,
}: ReferencesSectionProps) {
  const [items, setItems] = useState<ReferenceItem[]>(
    initialData?.items ?? [],
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReferenceItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Persist ────────────────────────────────────────────────────────
  const saveAll = (newItems: ReferenceItem[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("references", {
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

  const handleEdit = (item: ReferenceItem) => {
    setDraft({ ...item });
    setEditingId(item.id);
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!draft) return;
    setDraft({ ...draft, [e.target.name]: e.target.value });
  };

  const handleSaveDraft = () => {
    if (!draft || !draft.name.trim()) return;
    const exists = items.some((i) => i.id === draft.id);
    const next = exists
      ? items.map((i) => (i.id === draft.id ? draft : i))
      : [...items, draft];
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
  const EditForm = ({ p }: { p: ReferenceItem }) => (
    <div className="border border-blue-300 bg-blue-50 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Họ tên *</label>
          <input
            name="name"
            value={p.name}
            onChange={handleDraftChange}
            placeholder="Nguyễn Văn A"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Chức vụ</label>
          <input
            name="title"
            value={p.title}
            onChange={handleDraftChange}
            placeholder="Engineering Manager, Giảng viên..."
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Công ty / Tổ chức</label>
        <input
          name="organization"
          value={p.organization}
          onChange={handleDraftChange}
          placeholder="Tên công ty hoặc trường học"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Email</label>
          <input
            name="email"
            type="email"
            value={p.email}
            onChange={handleDraftChange}
            placeholder="example@company.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>SĐT</label>
          <input
            name="phone"
            type="tel"
            value={p.phone}
            onChange={handleDraftChange}
            placeholder="0912 345 678"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Mối quan hệ</label>
        <input
          name="relationship"
          value={p.relationship}
          onChange={handleDraftChange}
          placeholder="Sếp cũ, Giảng viên hướng dẫn, Đồng nghiệp..."
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          id={`save-reference-${p.id}`}
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
      {items.length === 0 && editingId === null && (
        <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          Chưa có người tham chiếu nào. Bấm &ldquo;+ Thêm người tham chiếu&rdquo; để bắt đầu.
        </p>
      )}

      {items.map((item) =>
        editingId === item.id && draft ? (
          <EditForm key={item.id} p={draft} />
        ) : (
          <div
            key={item.id}
            className="border border-gray-200 bg-white rounded-xl p-4 flex items-start gap-4 group hover:border-blue-200 transition-colors"
          >
            <div className="shrink-0 w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5">
              <FontAwesomeIcon
                icon={faAddressCard}
                className="w-4 h-4 text-indigo-600"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-600">
                {[item.title, item.organization].filter(Boolean).join(" · ")}
              </p>
              <div className="flex flex-wrap gap-x-4 mt-1">
                {item.email && (
                  <p className="text-xs text-gray-400">{item.email}</p>
                )}
                {item.phone && (
                  <p className="text-xs text-gray-400">{item.phone}</p>
                )}
              </div>
              {item.relationship && (
                <span className="inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                  {item.relationship}
                </span>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                id={`edit-reference-${item.id}`}
                onClick={() => handleEdit(item)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Sửa"
              >
                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
              </button>
              <button
                id={`delete-reference-${item.id}`}
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

      {editingId === null ? (
        <button
          id="add-reference-btn"
          onClick={handleAddNew}
          className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 text-sm text-gray-500 hover:text-blue-600 rounded-xl transition-colors font-medium"
        >
          + Thêm người tham chiếu
        </button>
      ) : draft && !items.some((i) => i.id === draft.id) ? (
        <EditForm p={draft} />
      ) : null}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
