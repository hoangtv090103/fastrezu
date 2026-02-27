"use client";

import { useState, useTransition } from "react";
import { upsertVaultSection } from "@/app/(authenticated)/dashboard/vault/actions";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faTrash,
  faXmark,
  faLink,
} from "@fortawesome/free-solid-svg-icons";

// ── Types ──────────────────────────────────────────────────────────────
export interface ProjectItem {
  id: string;
  name: string;
  role: string;
  start_date: string;
  end_date: string;
  is_ongoing: boolean;
  technologies: string[];
  demo_url: string;
  description: string;
}

export type ProjectsData = {
  items: ProjectItem[];
};

interface ProjectsSectionProps {
  initialData?: ProjectsData;
  onSaved?: () => void;
  onError?: (msg: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────
const blankItem = (): ProjectItem => ({
  id: crypto.randomUUID(),
  name: "",
  role: "",
  start_date: "",
  end_date: "",
  is_ongoing: false,
  technologies: [],
  demo_url: "",
  description: "",
});

// ── Component ──────────────────────────────────────────────────────────
export default function ProjectsSection({
  initialData,
  onSaved,
  onError,
}: ProjectsSectionProps) {
  const [items, setItems] = useState<ProjectItem[]>(initialData?.items ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectItem | null>(null);
  const [techInput, setTechInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Persist ────────────────────────────────────────────────────────
  const saveAll = (newItems: ProjectItem[]) => {
    startTransition(async () => {
      const result = await upsertVaultSection("projects", {
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
    setTechInput("");
  };

  const handleEdit = (item: ProjectItem) => {
    setDraft({ ...item });
    setEditingId(item.id);
    setTechInput("");
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

  // Tech tag management
  const addTech = () => {
    if (!draft || !techInput.trim()) return;
    const tag = techInput.trim();
    if (!draft.technologies.includes(tag)) {
      setDraft({ ...draft, technologies: [...draft.technologies, tag] });
    }
    setTechInput("");
  };

  const removeTech = (tag: string) => {
    if (!draft) return;
    setDraft({
      ...draft,
      technologies: draft.technologies.filter((t) => t !== tag),
    });
  };

  const handleTechKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTech();
    }
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
    setTechInput("");
    saveAll(next);
  };

  const handleCancelDraft = () => {
    setEditingId(null);
    setDraft(null);
    setTechInput("");
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
  const renderForm = (p: ProjectItem) => (
    <div className="border border-blue-300 bg-blue-50 rounded-xl p-4 space-y-3">
      {/* Row 1: Name + Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tên dự án *</label>
          <input
            name="name"
            value={p.name}
            onChange={handleDraftChange}
            placeholder="FastRezu AI Platform"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Vai trò của bạn</label>
          <input
            name="role"
            value={p.role}
            onChange={handleDraftChange}
            placeholder="Fullstack Developer / Lead"
            className={inputClass}
          />
        </div>
      </div>

      {/* Row 2: Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <label className={labelClass}>Bắt đầu</label>
          <MonthYearPicker
            value={p.start_date}
            onChange={(v) => handleDateChange("start_date", v)}
            placeholder="Chọn tháng bắt đầu"
          />
        </div>
        <div>
          <label className={labelClass}>Kết thúc</label>
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
          Đang thực hiện
        </label>
      </div>

      {/* Row 3: Technologies (tag input) */}
      <div>
        <label className={labelClass}>Công nghệ sử dụng</label>
        <div className="flex flex-wrap gap-1.5 p-2 border border-gray-300 rounded-lg bg-white min-h-[40px]">
          {p.technologies.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTech(tag)}
                className="hover:text-blue-900"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleTechKeyDown}
            onBlur={addTech}
            placeholder={
              p.technologies.length === 0
                ? "React, Node.js, PostgreSQL... (Enter để thêm)"
                : ""
            }
            className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder-gray-400"
          />
        </div>
      </div>

      {/* Row 4: Demo URL */}
      <div>
        <label className={labelClass}>Link demo / GitHub (optional)</label>
        <input
          name="demo_url"
          value={p.demo_url}
          onChange={handleDraftChange}
          placeholder="https://github.com/you/project"
          className={inputClass}
          type="url"
        />
      </div>

      {/* Row 5: Description */}
      <div>
        <label className={labelClass}>Mô tả & Kết quả đạt được</label>
        <textarea
          name="description"
          value={p.description}
          onChange={handleDraftChange}
          rows={4}
          placeholder="• Xây dựng hệ thống X, giảm thời gian xử lý 40%&#10;• Tích hợp AI pipeline với LangChain..."
          className={inputClass + " resize-none"}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          id={`save-project-${p.id}`}
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
      {/* Add button / new item form — TOP */}
      {editingId === null ? (
        <button
          id="add-project-btn"
          onClick={handleAddNew}
          className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 text-sm text-gray-500 hover:text-blue-600 rounded-xl transition-colors font-medium"
        >
          + Thêm dự án
        </button>
      ) : draft && !items.some((i) => i.id === draft.id) ? (
        renderForm(draft)
      ) : null}

      {/* Empty state */}
      {items.length === 0 && editingId === null && (
        <p className="text-sm text-gray-400 py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
          Chưa có dự án nào. Bấm &ldquo;+ Thêm dự án&rdquo; để bắt đầu.
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
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
              {item.role && (
                <p className="text-sm text-gray-600">{item.role}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                {item.start_date}
                {item.start_date && " → "}
                {item.is_ongoing ? "Hiện tại" : item.end_date}
              </p>
              {item.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              {item.demo_url && (
                <a
                  href={item.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                >
                  <FontAwesomeIcon icon={faLink} className="w-3 h-3" />
                  {item.demo_url.replace(/^https?:\/\//, "")}
                </a>
              )}
              {item.description && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 whitespace-pre-line">
                  {item.description}
                </p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                id={`edit-project-${item.id}`}
                onClick={() => handleEdit(item)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Sửa"
              >
                <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
              </button>
              <button
                id={`delete-project-${item.id}`}
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
