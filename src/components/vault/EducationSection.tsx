"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  major: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  gpa: string;
  description: string;
}

type EducationData = {
  items: EducationItem[];
};

interface EducationSectionProps {
  initialData?: EducationData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

const blankItem = (): EducationItem => ({
  id: crypto.randomUUID(),
  school: "",
  degree: "",
  major: "",
  start_date: "",
  end_date: "",
  is_current: false,
  gpa: "",
  description: "",
});

export default function EducationSection({
  initialData,
  onSaved,
  onError,
}: EducationSectionProps) {
  const [items, setItems] = useState<EducationItem[]>(initialData?.items ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EducationItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveAll = (newItems: EducationItem[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("education", {
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

  const handleAddNew = () => {
    const item = blankItem();
    setDraft(item);
    setEditingId(item.id);
  };

  const handleEdit = (item: EducationItem) => {
    setDraft({ ...item });
    setEditingId(item.id);
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

  const handleDraftDateChange = (
    field: "start_date" | "end_date",
    value: string,
  ) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const handleSaveDraft = () => {
    if (!draft) return;
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

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  const renderForm = (item: EducationItem) => (
    <div className="border border-blue-300 bg-blue-50 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tên trường *</label>
          <input
            name="school"
            value={item.school}
            onChange={handleDraftChange}
            placeholder="Đại học Bách Khoa TP.HCM"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Bằng cấp</label>
          <input
            name="degree"
            value={item.degree}
            onChange={handleDraftChange}
            placeholder="Cử nhân / Thạc sĩ"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Chuyên ngành *</label>
          <input
            name="major"
            value={item.major}
            onChange={handleDraftChange}
            placeholder="Khoa học Máy tính"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>GPA (tùy chọn)</label>
          <input
            name="gpa"
            value={item.gpa}
            onChange={handleDraftChange}
            placeholder="3.8/4.0"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className={labelClass}>Bắt đầu</label>
          <MonthYearPicker
            value={item.start_date}
            onChange={(v) => handleDraftDateChange("start_date", v)}
            placeholder="Chọn tháng bắt đầu"
          />
        </div>
        <div>
          <label className={labelClass}>Kết thúc</label>
          <MonthYearPicker
            value={item.end_date}
            onChange={(v) => handleDraftDateChange("end_date", v)}
            placeholder="Chọn tháng kết thúc"
            disabled={item.is_current}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_current"
            checked={item.is_current}
            onChange={handleDraftChange}
            className="rounded"
          />
          Đang học
        </label>
      </div>
      <div>
        <label className={labelClass}>Hoạt động / Thành tích (tùy chọn)</label>
        <textarea
          name="description"
          value={item.description}
          onChange={handleDraftChange}
          rows={3}
          placeholder="Trưởng CLB, Học bổng..."
          className={inputClass + " resize-none"}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          id={`save-education-btn`}
          onClick={handleSaveDraft}
          disabled={isPending || !item.school || !item.major}
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
  );

  return (
    <div className="space-y-4">
      {/* Add button / new item form — TOP */}
      {editingId === null ? (
        <button
          id="add-education-btn"
          onClick={handleAddNew}
          className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 text-sm text-gray-500 hover:text-blue-600 rounded-xl transition-colors font-medium"
        >
          + Thêm học vấn
        </button>
      ) : !items.some((i) => i.id === editingId) && draft ? (
        renderForm(draft)
      ) : null}

      {/* Empty state */}
      {items.length === 0 && editingId === null && (
        <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          Chưa có học vấn nào. Bấm &ldquo;+ Thêm học vấn&rdquo; để bắt đầu.
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {item.major}
              </p>
              <p className="text-sm text-gray-600">
                {item.school} {item.degree ? `· ${item.degree}` : ""}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.start_date} →{" "}
                {item.is_current ? "Hiện tại" : item.end_date}
                {item.gpa ? ` · GPA: ${item.gpa}` : ""}
              </p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                id={`edit-education-${item.id}`}
                onClick={() => handleEdit(item)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Sửa"
              >
                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
              </button>
              <button
                id={`delete-education-${item.id}`}
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
