"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";

export interface ExperienceItem {
  id: string;
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

type ExperienceData = {
  items: ExperienceItem[];
};

interface ExperienceSectionProps {
  initialData?: ExperienceData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

const blankItem = (): ExperienceItem => ({
  id: crypto.randomUUID(),
  company: "",
  title: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
});

export default function ExperienceSection({
  initialData,
  onSaved,
  onError,
}: ExperienceSectionProps) {
  const [items, setItems] = useState<ExperienceItem[]>(
    initialData?.items ?? [],
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExperienceItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveAll = (newItems: ExperienceItem[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("experience", {
        items: newItems,
      } as unknown as Parameters<typeof upsertVaultSection>[1]);
      if (!result.success) setError(result.error ?? "Lỗi khi lưu");
      else setError(null);
    });
  };

  const handleAddNew = () => {
    const item = blankItem();
    setDraft(item);
    setEditingId(item.id);
  };

  const handleEdit = (item: ExperienceItem) => {
    setDraft({ ...item });
    setEditingId(item.id);
  };

  const handleDraftDateChange = (
    field: "start_date" | "end_date",
    value: string,
  ) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const handleDraftChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!draft) return;
    const { name, value, type } = e.target;
    setDraft({
      ...draft,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSaveDraft = () => {
    if (!draft) return;
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

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="space-y-4">
      {/* List */}
      {items.length === 0 && editingId === null && (
        <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          Chưa có kinh nghiệm nào. Bấm &ldquo;+ Thêm kinh nghiệm&rdquo; để bắt
          đầu.
        </p>
      )}

      {items.map((item) =>
        editingId === item.id && draft ? (
          /* ── Inline edit form ── */
          <div
            key={item.id}
            className="border border-blue-300 bg-blue-50 rounded-xl p-4 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tên công ty *</label>
                <input
                  name="company"
                  value={draft.company}
                  onChange={handleDraftChange}
                  placeholder="Google Vietnam"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Chức vụ *</label>
                <input
                  name="title"
                  value={draft.title}
                  onChange={handleDraftChange}
                  placeholder="Software Engineer"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className={labelClass}>Bắt đầu</label>
                <MonthYearPicker
                  value={draft.start_date}
                  onChange={(v) => handleDraftDateChange("start_date", v)}
                  placeholder="Chọn tháng bắt đầu"
                />
              </div>
              <div>
                <label className={labelClass}>Kết thúc</label>
                <MonthYearPicker
                  value={draft.end_date}
                  onChange={(v) => handleDraftDateChange("end_date", v)}
                  placeholder="Chọn tháng kết thúc"
                  disabled={draft.is_current}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_current"
                  checked={draft.is_current}
                  onChange={handleDraftChange}
                  className="rounded"
                />
                Đang làm
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Mô tả công việc (dùng gạch đầu dòng)
              </label>
              <textarea
                name="description"
                value={draft.description}
                onChange={handleDraftChange}
                rows={4}
                placeholder="• Xây dựng tính năng X, tăng hiệu suất Y%&#10;• Dẫn dắt team Z người..."
                className={inputClass + " resize-none"}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                id={`save-experience-${draft.id}`}
                onClick={handleSaveDraft}
                disabled={isPending || !draft.company || !draft.title}
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
        ) : (
          /* ── Display card ── */
          <div
            key={item.id}
            className="border border-gray-200 bg-white rounded-xl p-4 flex items-start gap-4 group hover:border-blue-200 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-600">{item.company}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.start_date} →{" "}
                    {item.is_current ? "Hiện tại" : item.end_date}
                  </p>
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 whitespace-pre-line">
                  {item.description}
                </p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                id={`edit-experience-${item.id}`}
                onClick={() => handleEdit(item)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Sửa"
              >
                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
              </button>
              <button
                id={`delete-experience-${item.id}`}
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

      {/* Add new form (when no item is being edited) */}
      {editingId === null ? (
        <button
          id="add-experience-btn"
          onClick={handleAddNew}
          className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 text-sm text-gray-500 hover:text-blue-600 rounded-xl transition-colors font-medium"
        >
          + Thêm kinh nghiệm
        </button>
      ) : editingId === draft?.id && !items.some((i) => i.id === draft?.id) ? (
        /* New item edit form */
        <div className="border border-blue-300 bg-blue-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tên công ty *</label>
              <input
                name="company"
                value={draft?.company ?? ""}
                onChange={handleDraftChange}
                placeholder="Google Vietnam"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Chức vụ *</label>
              <input
                name="title"
                value={draft?.title ?? ""}
                onChange={handleDraftChange}
                placeholder="Software Engineer"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className={labelClass}>Bắt đầu</label>
              <MonthYearPicker
                value={draft?.start_date ?? ""}
                onChange={(v) => handleDraftDateChange("start_date", v)}
                placeholder="Chọn tháng bắt đầu"
              />
            </div>
            <div>
              <label className={labelClass}>Kết thúc</label>
              <MonthYearPicker
                value={draft?.end_date ?? ""}
                onChange={(v) => handleDraftDateChange("end_date", v)}
                placeholder="Chọn tháng kết thúc"
                disabled={draft?.is_current}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_current"
                checked={draft?.is_current ?? false}
                onChange={handleDraftChange}
                className="rounded"
              />
              Đang làm
            </label>
          </div>
          <div>
            <label className={labelClass}>Mô tả công việc</label>
            <textarea
              name="description"
              value={draft?.description ?? ""}
              onChange={handleDraftChange}
              rows={4}
              placeholder="• Xây dựng tính năng X..."
              className={inputClass + " resize-none"}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              id="save-new-experience-btn"
              onClick={handleSaveDraft}
              disabled={isPending || !draft?.company || !draft?.title}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
            >
              {isPending ? "Đang lưu…" : "Lưu"}
            </button>
            <button
              onClick={handleCancelDraft}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
