"use client";

import { useState, useTransition, useEffect } from "react";
import {
  addJob,
  updateJob,
  type NewJobCard,
} from "@/app/(authenticated)/dashboard/jobs/actions";
import type { JobCard } from "./KanbanBoard";

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobAdded: (job: NewJobCard) => void;
  editJob?: JobCard;
  onJobUpdated?: (job: JobCard) => void;
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "block text-xs font-medium text-gray-600 mb-1";

export default function AddJobModal({
  isOpen,
  onClose,
  onJobAdded,
  editJob,
  onJobUpdated,
}: AddJobModalProps) {
  const isEditMode = Boolean(editJob);
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [rawJdText, setRawJdText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Pre-fill or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(editJob?.title ?? "");
      setCompanyName(editJob?.company_name ?? "");
      setJobUrl(editJob?.job_url ?? "");
      setRawJdText("");
      setError(null);
    }
  }, [isOpen, editJob]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = () => {
    if (!title.trim() || !companyName.trim()) return;
    setError(null);

    startTransition(async () => {
      if (isEditMode && editJob) {
        const result = await updateJob(editJob.id, {
          title,
          company_name: companyName,
          job_url: jobUrl || undefined,
          raw_jd_text: rawJdText || undefined,
        });
        if (!result.success) {
          setError(result.error ?? "Lỗi khi lưu");
        } else {
          onJobUpdated?.({
            ...editJob,
            title: title.trim(),
            company_name: companyName.trim(),
            job_url: jobUrl.trim() || null,
            raw_jd_text: rawJdText
              ? rawJdText.trim()
              : (editJob.raw_jd_text ?? null),
          });
          onClose();
        }
      } else {
        const result = await addJob({
          title,
          company_name: companyName,
          job_url: jobUrl || undefined,
          raw_jd_text: rawJdText || undefined,
        });
        if (!result.success) {
          setError(result.error);
        } else {
          onJobAdded(result.job);
          onClose();
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-5">
          {isEditMode ? "Sửa thông tin Job" : "Thêm Job mới"}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tên vị trí *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Software Engineer"
                className={inputClass}
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>Tên công ty *</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Google Vietnam"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Job URL{" "}
              <span className="text-gray-400 font-normal">(tùy chọn)</span>
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://careers.google.com/..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Mô tả công việc (JD){" "}
              <span className="text-gray-400 font-normal">(tùy chọn)</span>
            </label>
            <textarea
              value={rawJdText}
              onChange={(e) => setRawJdText(e.target.value)}
              placeholder={
                isEditMode
                  ? "Dán JD mới để cập nhật (để trống nếu không thay đổi)..."
                  : "Dán toàn bộ nội dung JD vào đây..."
              }
              rows={6}
              className={inputClass + " resize-none"}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !title.trim() || !companyName.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
          >
            {isPending ? "Đang lưu…" : isEditMode ? "Lưu thay đổi" : "Thêm Job"}
          </button>
        </div>
      </div>
    </div>
  );
}
