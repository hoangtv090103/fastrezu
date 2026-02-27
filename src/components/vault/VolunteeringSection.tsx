"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash, faHandshake } from "@fortawesome/free-solid-svg-icons";

// ── Types ──────────────────────────────────────────────────────────────
export interface VolunteerItem {
  id: string;
  activity: string;
  organization: string;
  role: string;
  start_date: string;
  end_date: string;
  is_ongoing: boolean;
  description: string;
}

export type VolunteeringData = {
  items: VolunteerItem[];
};

interface VolunteeringSectionProps {
  initialData?: VolunteeringData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────
const blankItem = (): VolunteerItem => ({
  id: crypto.randomUUID(),
  activity: "",
  organization: "",
  role: "",
  start_date: "",
  end_date: "",
  is_ongoing: false,
  description: "",
});

// ── Component ──────────────────────────────────────────────────────────
export default function VolunteeringSection({
  initialData,
  onSaved,
  onError,
}: VolunteeringSectionProps) {
  const [items, setItems] = useState<VolunteerItem[]>(initialData?.items ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VolunteerItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Persist ────────────────────────────────────────────────────────
  const saveAll = (newItems: VolunteerItem[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("volunteering", {
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

  const handleEdit = (item: VolunteerItem) => {
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

  const handleDateChange = (
    field: "start_date" | "end_date",
    value: string,
  ) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const handleSaveDraft = () => {
    if (!draft || !draft.activity.trim()) return;
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
  const renderForm = (p: VolunteerItem) => (
    <div className="border border-blue-300 bg-blue-50 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tên hoạt động *</label>
          <input
            name="activity"
            value={p.activity}
            onChange={handleDraftChange}
            placeholder="Chiến dịch Mùa hè xanh, Mentor tại..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tổ chức</label>
          <input
            name="organization"
            value={p.organization}
            onChange={handleDraftChange}
            placeholder="Đoàn TNCS HCM, NGO..."
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Vai trò</label>
        <input
          name="role"
          value={p.role}
          onChange={handleDraftChange}
          placeholder="Trưởng nhóm, Tình nguyện viên..."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className={labelClass}>Từ tháng</label>
          <MonthYearPicker
            value={p.start_date}
            onChange={(v) => handleDateChange("start_date", v)}
            placeholder="Chọn tháng bắt đầu"
          />
        </div>
        <div>
          <label className={labelClass}>Đến tháng</label>
          <MonthYearPicker
            value={p.end_date}
            onChange={(v) => handleDateChange("end_date", v)}
            placeholder="Chọn tháng kết thúc"
            disabled={p.is_ongoing}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_ongoing"
            checked={p.is_ongoing}
            onChange={handleDraftChange}
            className="rounded"
          />
          Đang tham gia
        </label>
      </div>

      <div>
        <label className={labelClass}>Mô tả</label>
        <textarea
          name="description"
          value={p.description}
          onChange={handleDraftChange}
          placeholder="Mô tả những gì bạn đã làm và kết quả đạt được..."
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          id={`save-volunteer-${p.id}`}
          onClick={handleSaveDraft}
          disabled={isPending || !p.activity.trim()}
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
          id="add-volunteer-btn"
          onClick={handleAddNew}
          className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 text-sm text-gray-500 hover:text-blue-600 rounded-xl transition-colors font-medium"
        >
          + Thêm hoạt động
        </button>
      ) : draft && !items.some((i) => i.id === draft.id) ? (
        renderForm(draft)
      ) : null}

      {items.length === 0 && editingId === null && (
        <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          Chưa có hoạt động nào. Bấm &ldquo;+ Thêm hoạt động&rdquo; để bắt đầu.
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
            <div className="shrink-0 w-9 h-9 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
              <FontAwesomeIcon
                icon={faHandshake}
                className="w-4 h-4 text-green-600"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {item.activity}
              </p>
              <p className="text-sm text-gray-600">
                {[item.role, item.organization].filter(Boolean).join(" · ")}
              </p>
              {(item.start_date || item.is_ongoing) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.start_date}
                  {item.is_ongoing
                    ? " → Hiện tại"
                    : item.end_date
                      ? ` → ${item.end_date}`
                      : ""}
                </p>
              )}
              {item.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                id={`edit-volunteer-${item.id}`}
                onClick={() => handleEdit(item)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Sửa"
              >
                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
              </button>
              <button
                id={`delete-volunteer-${item.id}`}
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
