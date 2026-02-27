"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrash,
  faLink,
  faAward,
} from "@fortawesome/free-solid-svg-icons";

// ── Types ──────────────────────────────────────────────────────────────
export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string;
  has_expiry: boolean;
  credential_id: string;
  credential_url: string;
}

export type CertificationsData = {
  items: CertificationItem[];
};

interface CertificationsSectionProps {
  initialData?: CertificationsData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────
const blankItem = (): CertificationItem => ({
  id: crypto.randomUUID(),
  name: "",
  issuer: "",
  issue_date: "",
  expiry_date: "",
  has_expiry: false,
  credential_id: "",
  credential_url: "",
});

// ── Component ──────────────────────────────────────────────────────────
export default function CertificationsSection({
  initialData,
  onSaved,
  onError,
}: CertificationsSectionProps) {
  const [items, setItems] = useState<CertificationItem[]>(
    initialData?.items ?? [],
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CertificationItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Persist ────────────────────────────────────────────────────────
  const saveAll = (newItems: CertificationItem[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("certifications", {
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

  const handleEdit = (item: CertificationItem) => {
    setDraft({ ...item });
    setEditingId(item.id);
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!draft) return;
    const { name, value, type } = e.target;
    setDraft({
      ...draft,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleDateChange = (
    field: "issue_date" | "expiry_date",
    value: string,
  ) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
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
  const renderForm = (p: CertificationItem) => (
    <div className="border border-blue-300 bg-blue-50 rounded-xl p-4 space-y-3">
      {/* Row 1: Cert name + Issuer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tên chứng chỉ *</label>
          <input
            name="name"
            value={p.name}
            onChange={handleDraftChange}
            placeholder="AWS Solutions Architect, IELTS 7.5..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Tổ chức cấp *</label>
          <input
            name="issuer"
            value={p.issuer}
            onChange={handleDraftChange}
            placeholder="Amazon Web Services, IDP..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 2: Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className={labelClass}>Ngày cấp</label>
          <MonthYearPicker
            value={p.issue_date}
            onChange={(v) => handleDateChange("issue_date", v)}
            placeholder="Chọn tháng cấp"
          />
        </div>
        <div>
          <label className={labelClass}>Ngày hết hạn (nếu có)</label>
          <MonthYearPicker
            value={p.expiry_date}
            onChange={(v) => handleDateChange("expiry_date", v)}
            placeholder="Chọn tháng hết hạn"
            disabled={!p.has_expiry}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
          <input
            type="checkbox"
            name="has_expiry"
            checked={p.has_expiry}
            onChange={handleDraftChange}
            className="rounded"
          />
          Có hạn sử dụng
        </label>
      </div>

      {/* Row 3: Credential ID + URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Mã chứng chỉ (optional)</label>
          <input
            name="credential_id"
            value={p.credential_id}
            onChange={handleDraftChange}
            placeholder="ABC-123456"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Link xác thực (optional)</label>
          <input
            name="credential_url"
            value={p.credential_url}
            onChange={handleDraftChange}
            placeholder="https://www.credly.com/..."
            className={inputClass}
            type="url"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          id={`save-cert-${p.id}`}
          onClick={handleSaveDraft}
          disabled={isPending || !p.name.trim() || !p.issuer.trim()}
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
      {/* Add button / new item form — TOP */}
      {editingId === null ? (
        <button
          id="add-cert-btn"
          onClick={handleAddNew}
          className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 text-sm text-gray-500 hover:text-blue-600 rounded-xl transition-colors font-medium"
        >
          + Thêm chứng chỉ
        </button>
      ) : draft && !items.some((i) => i.id === draft.id) ? (
        renderForm(draft)
      ) : null}

      {/* Empty state */}
      {items.length === 0 && editingId === null && (
        <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          Chưa có chứng chỉ nào. Bấm &ldquo;+ Thêm chứng chỉ&rdquo; để bắt đầu.
        </p>
      )}

      {/* List */}
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
                icon={faAward}
                className="w-4 h-4 text-amber-600"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-600">{item.issuer}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.issue_date}
                {item.has_expiry && item.expiry_date
                  ? ` → ${item.expiry_date}`
                  : item.issue_date
                    ? " · Không hết hạn"
                    : ""}
              </p>
              {item.credential_id && (
                <p className="text-xs text-gray-400 mt-0.5">
                  ID: {item.credential_id}
                </p>
              )}
              {item.credential_url && (
                <a
                  href={item.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                >
                  <FontAwesomeIcon icon={faLink} className="w-3 h-3" />
                  Xem xác thực
                </a>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                id={`edit-cert-${item.id}`}
                onClick={() => handleEdit(item)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Sửa"
              >
                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
              </button>
              <button
                id={`delete-cert-${item.id}`}
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
