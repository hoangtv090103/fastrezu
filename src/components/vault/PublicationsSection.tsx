"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrash,
  faBook,
  faLink,
} from "@fortawesome/free-solid-svg-icons";

// ── Types ──────────────────────────────────────────────────────────────
export interface PublicationItem {
  id: string;
  title: string;
  publisher: string;
  year: string;
  doi_url: string;
}

export type PublicationsData = {
  items: PublicationItem[];
};

interface PublicationsSectionProps {
  initialData?: PublicationsData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────
const blankItem = (): PublicationItem => ({
  id: crypto.randomUUID(),
  title: "",
  publisher: "",
  year: "",
  doi_url: "",
});

// ── Component ──────────────────────────────────────────────────────────
export default function PublicationsSection({
  initialData,
  onSaved,
  onError,
}: PublicationsSectionProps) {
  const [items, setItems] = useState<PublicationItem[]>(
    initialData?.items ?? [],
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PublicationItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Persist ────────────────────────────────────────────────────────
  const saveAll = (newItems: PublicationItem[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("publications", {
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

  const handleEdit = (item: PublicationItem) => {
    setDraft({ ...item });
    setEditingId(item.id);
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!draft) return;
    setDraft({ ...draft, [e.target.name]: e.target.value });
  };

  const handleSaveDraft = () => {
    if (!draft || !draft.title.trim()) return;
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
  const renderForm = (p: PublicationItem) => (
    <div className="border border-blue-300 bg-blue-50 rounded-xl p-4 space-y-3">
      <div>
        <label className={labelClass}>Tiêu đề *</label>
        <input
          name="title"
          value={p.title}
          onChange={handleDraftChange}
          placeholder="Deep Learning for NLP: A Survey..."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tạp chí / Hội nghị</label>
          <input
            name="publisher"
            value={p.publisher}
            onChange={handleDraftChange}
            placeholder="NeurIPS, ACL, IEEE Access..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Năm</label>
          <input
            name="year"
            value={p.year}
            onChange={handleDraftChange}
            placeholder="2024"
            maxLength={4}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Link DOI / URL (optional)</label>
        <input
          name="doi_url"
          type="url"
          value={p.doi_url}
          onChange={handleDraftChange}
          placeholder="https://doi.org/10.xxxx/..."
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          id={`save-publication-${p.id}`}
          onClick={handleSaveDraft}
          disabled={isPending || !p.title.trim()}
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
          Chưa có bài báo nào. Bấm &ldquo;+ Thêm bài báo&rdquo; để bắt đầu.
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
            <div className="shrink-0 w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center mt-0.5">
              <FontAwesomeIcon
                icon={faBook}
                className="w-4 h-4 text-violet-600"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {item.title}
              </p>
              <p className="text-sm text-gray-600">
                {[item.publisher, item.year].filter(Boolean).join(" · ")}
              </p>
              {item.doi_url && (
                <a
                  href={item.doi_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                >
                  <FontAwesomeIcon icon={faLink} className="w-3 h-3" />
                  Xem bài báo
                </a>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                id={`edit-publication-${item.id}`}
                onClick={() => handleEdit(item)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Sửa"
              >
                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
              </button>
              <button
                id={`delete-publication-${item.id}`}
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
          id="add-publication-btn"
          onClick={handleAddNew}
          className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 text-sm text-gray-500 hover:text-blue-600 rounded-xl transition-colors font-medium"
        >
          + Thêm bài báo
        </button>
      ) : draft && !items.some((i) => i.id === draft.id) ? (
        renderForm(draft)
      ) : null}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
