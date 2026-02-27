"use client";

import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faPen,
  faBuilding,
  faLink,
  faCalendar,
  faFileText,
} from "@fortawesome/free-solid-svg-icons";
import type { JobCard } from "./KanbanBoard";

// ── Status config ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  saved: {
    label: "Đã lưu",
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  optimized: {
    label: "Đã tối ưu",
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  applied: {
    label: "Đã nộp",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  interviewing: {
    label: "Phỏng vấn",
    bg: "bg-orange-100",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  offer: {
    label: "Offer",
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  rejected: {
    label: "Từ chối",
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface PropertyRowProps {
  icon: typeof faPen;
  label: string;
  children: React.ReactNode;
}

function PropertyRow({ icon, label, children }: PropertyRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 w-36 shrink-0 pt-0.5">
        <FontAwesomeIcon icon={icon} className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="flex-1 text-sm text-gray-800">{children}</div>
    </div>
  );
}

interface JobDetailModalProps {
  job: JobCard;
  onClose: () => void;
  onEdit: (job: JobCard) => void;
}

export default function JobDetailModal({
  job,
  onClose,
  onEdit,
}: JobDetailModalProps) {
  const status = job.status ?? "saved";
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.saved;

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top toolbar ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            Chi tiết Job
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onEdit(job); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
              Sửa
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Title ── */}
        <div className="px-6 pb-5 shrink-0">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            {job.title}
          </h1>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6">
          {/* Properties */}
          <div className="bg-gray-50 rounded-xl px-4 py-1 mb-5">
            <PropertyRow icon={faBuilding} label="Công ty">
              {job.company_name}
            </PropertyRow>

            <PropertyRow icon={faFileText} label="Trạng thái">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </PropertyRow>

            <PropertyRow icon={faCalendar} label="Ngày thêm">
              <span className="text-gray-600">{formatDate(job.created_at)}</span>
            </PropertyRow>

            {job.job_url && (
              <PropertyRow icon={faLink} label="Job URL">
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate block max-w-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {job.job_url}
                </a>
              </PropertyRow>
            )}
          </div>

          {/* JD content */}
          {job.raw_jd_text ? (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Mô tả công việc (JD)
              </h2>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl px-4 py-4">
                {job.raw_jd_text}
              </div>
            </div>
          ) : (
            <div className="mb-6 text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-sm text-gray-400">
                Chưa có mô tả công việc. Bấm{" "}
                <button
                  onClick={() => { onEdit(job); onClose(); }}
                  className="text-blue-500 hover:underline"
                >
                  Sửa
                </button>{" "}
                để thêm JD.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
