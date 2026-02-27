"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsis,
  faPen,
  faCopy,
  faTrash,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import AddJobModal from "./AddJobModal";
import JobDetailModal from "./JobDetailModal";
import type { NewJobCard } from "@/app/(authenticated)/dashboard/jobs/actions";
import {
  updateJobStatus,
  deleteJob,
  duplicateJob,
} from "@/app/(authenticated)/dashboard/jobs/actions";
import { useTranslation } from "@/hooks/useTranslation";

// ── Types ──────────────────────────────────────────────────────────────
export interface JobCard {
  id: string;
  title: string;
  company_name: string;
  status: string | null;
  created_at: string | null;
  job_url: string | null;
  raw_jd_text?: string | null;
  has_resume?: boolean;
}

interface KanbanBoardProps {
  initialJobs: JobCard[];
}

// ── Column definitions (styling only — labels come from i18n) ──────────
const COLUMNS: {
  id: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
}[] = [
  { id: "saved",        badgeBg: "bg-blue-100",   badgeText: "text-blue-700",   accentColor: "border-blue-500" },
  { id: "optimized",    badgeBg: "bg-purple-100",  badgeText: "text-purple-700", accentColor: "border-purple-500" },
  { id: "applied",      badgeBg: "bg-yellow-100",  badgeText: "text-yellow-700", accentColor: "border-yellow-500" },
  { id: "interviewing", badgeBg: "bg-orange-100",  badgeText: "text-orange-700", accentColor: "border-orange-500" },
  { id: "offer",        badgeBg: "bg-green-100",   badgeText: "text-green-700",  accentColor: "border-green-500" },
  { id: "rejected",     badgeBg: "bg-red-100",     badgeText: "text-red-700",    accentColor: "border-red-500" },
];

// ── Helpers ─────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Delete Confirm Popup ─────────────────────────────────────────────────
function DeleteConfirmModal({
  job,
  onConfirm,
  onCancel,
}: {
  job: JobCard;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faTrash} className="w-4 h-4 text-red-600" />
          </div>
          <h2 className="text-base font-bold text-gray-900">{t("warRoom.deleteConfirm.title")}</h2>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
          <p className="text-xs text-gray-500 truncate">{job.company_name}</p>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          {t("warRoom.deleteConfirm.message")}{" "}
          <span className="font-semibold text-red-600">{t("warRoom.deleteConfirm.irreversible")}</span>
          .
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t("warRoom.deleteConfirm.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {t("warRoom.deleteConfirm.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card Menu ────────────────────────────────────────────────────────────
function CardMenu({
  job,
  onEdit,
  onDuplicate,
  onDeleteRequest,
  onClose,
}: {
  job: JobCard;
  onEdit: (job: JobCard) => void;
  onDuplicate: (job: JobCard) => void;
  onDeleteRequest: (job: JobCard) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  const items = [
    {
      icon: faPen,
      label: t("warRoom.cardMenu.edit"),
      iconClass: "text-blue-500",
      onClick: () => { onEdit(job); onClose(); },
    },
    {
      icon: faCopy,
      label: t("warRoom.cardMenu.duplicate"),
      iconClass: "text-gray-500",
      onClick: () => { onDuplicate(job); onClose(); },
    },
    {
      icon: faTrash,
      label: t("warRoom.cardMenu.delete"),
      iconClass: "text-red-500",
      onClick: () => { onDeleteRequest(job); onClose(); },
    },
  ];

  return (
    <div className="absolute top-7 right-1 z-30 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[120px]">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick();
          }}
          onDragStart={(e) => e.stopPropagation()}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FontAwesomeIcon icon={item.icon} className={`w-3.5 h-3.5 ${item.iconClass}`} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Column ──────────────────────────────────────────────────────────────
interface KanbanColumnProps {
  col: (typeof COLUMNS)[number];
  cards: JobCard[];
  draggingId: string | null;
  dragOverColId: string | null;
  openMenuId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (colId: string) => void;
  onDragLeave: () => void;
  onDrop: (colId: string) => void;
  onMenuToggle: (id: string | null) => void;
  onCardClick: (job: JobCard) => void;
  onEdit: (job: JobCard) => void;
  onDuplicate: (job: JobCard) => void;
  onDeleteRequest: (job: JobCard) => void;
}

function KanbanColumn({
  col,
  cards,
  draggingId,
  dragOverColId,
  openMenuId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onMenuToggle,
  onCardClick,
  onEdit,
  onDuplicate,
  onDeleteRequest,
}: KanbanColumnProps) {
  const { t } = useTranslation();
  const isOver = dragOverColId === col.id;
  const emptyLabel = col.id === "saved"
    ? t("warRoom.columns.emptyFirst")
    : t("warRoom.columns.emptyOther");

  return (
    <div className="flex flex-col flex-1 min-w-[160px]">
      <div
        onDragOver={(e) => { e.preventDefault(); onDragOver(col.id); }}
        onDragLeave={onDragLeave}
        onDrop={(e) => { e.preventDefault(); onDrop(col.id); }}
        className={`flex flex-col gap-2 flex-1 rounded-xl p-1.5 min-h-[80px] transition-colors
          ${isOver ? "bg-blue-50 ring-2 ring-blue-300 ring-dashed" : ""}`}
      >
        {cards.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors
              ${isOver ? "border-blue-400" : "border-gray-200"}`}
          >
            <p className="text-xs text-gray-400">{emptyLabel}</p>
          </div>
        ) : (
          cards.map((job) => (
            <div
              key={job.id}
              draggable
              onDragStart={() => onDragStart(job.id)}
              onDragEnd={onDragEnd}
              onClick={() => onCardClick(job)}
              className={`bg-white border rounded-xl p-3 transition-all select-none
                cursor-pointer hover:shadow-sm group relative
                ${job.has_resume ? "border-purple-200 hover:border-purple-300" : "border-gray-200 hover:border-blue-200"}
                ${draggingId === job.id ? "opacity-40 scale-95" : ""}`}
            >
              <div className="pr-6">
                <p className="text-xs text-gray-500 truncate">{job.company_name}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2 leading-snug">
                  {job.title}
                </p>
              </div>

              {/* CV badge + date row */}
              <div className="flex items-center justify-between mt-2">
                {job.has_resume ? (
                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 text-xs font-medium hover:bg-purple-100 transition-colors"
                  >
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="w-2.5 h-2.5" />
                    CV đã may đo
                  </Link>
                ) : (
                  <span />
                )}
                <p className="text-xs text-gray-400">{formatDate(job.created_at)}</p>
              </div>

              <div className="absolute top-1.5 right-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuToggle(openMenuId === job.id ? null : job.id);
                  }}
                  onDragStart={(e) => e.stopPropagation()}
                  className={`p-1.5 rounded-lg transition-colors
                    ${openMenuId === job.id
                      ? "text-gray-600 bg-gray-100"
                      : "text-gray-400 opacity-0 group-hover:opacity-100 hover:text-gray-600 hover:bg-gray-100"
                    }`}
                  title={t("warRoom.cardMenu.options")}
                >
                  <FontAwesomeIcon icon={faEllipsis} className="w-3.5 h-3.5" />
                </button>

                {openMenuId === job.id && (
                  <CardMenu
                    job={job}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onDeleteRequest={onDeleteRequest}
                    onClose={() => onMenuToggle(null)}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Board ───────────────────────────────────────────────────────────
export default function KanbanBoard({ initialJobs }: KanbanBoardProps) {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<JobCard[]>(initialJobs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobCard | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [deletingJob, setDeletingJob] = useState<JobCard | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [viewingJob, setViewingJob] = useState<JobCard | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openMenuId]);

  const cardsByStatus = Object.fromEntries(
    COLUMNS.map((col) => [
      col.id,
      jobs.filter((j) => (j.status ?? "saved") === col.id),
    ]),
  );

  const isEmpty = jobs.length === 0;

  const handleJobAdded = (job: NewJobCard) => {
    setJobs((prev) => [job, ...prev]);
  };

  const handleJobUpdated = (updated: JobCard) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    setEditingJob(null);
  };

  const handleDuplicate = async (job: JobCard) => {
    const result = await duplicateJob(job.id);
    if (result.success) {
      setJobs((prev) => [result.job, ...prev]);
    }
  };

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColId(null);
  };

  const handleDrop = (targetColId: string) => {
    if (!draggingId) return;
    const currentStatus = jobs.find((j) => j.id === draggingId)?.status ?? "saved";
    if (targetColId === currentStatus) {
      setDraggingId(null);
      setDragOverColId(null);
      return;
    }
    const idToDrop = draggingId;
    setJobs((prev) =>
      prev.map((j) => (j.id === idToDrop ? { ...j, status: targetColId } : j)),
    );
    setDraggingId(null);
    setDragOverColId(null);
    updateJobStatus(idToDrop, targetColId).then((res) => {
      if (!res.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === idToDrop ? { ...j, status: currentStatus } : j)),
        );
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingJob) return;
    const id = deletingJob.id;
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setDeletingJob(null);
    deleteJob(id);
  };

  return (
    <div className="bg-gray-50">
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("warRoom.title")}</h1>
            <p className="text-sm text-gray-500 mt-1">{t("warRoom.subtitle")}</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {t("warRoom.addJob")}
          </button>
        </div>

        <AddJobModal
          isOpen={isModalOpen || editingJob !== null}
          onClose={() => { setIsModalOpen(false); setEditingJob(null); }}
          onJobAdded={handleJobAdded}
          editJob={editingJob ?? undefined}
          onJobUpdated={handleJobUpdated}
        />

        {deletingJob && (
          <DeleteConfirmModal
            job={deletingJob}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingJob(null)}
          />
        )}

        {viewingJob && (
          <JobDetailModal
            job={viewingJob}
            onClose={() => setViewingJob(null)}
            onEdit={(job) => { setViewingJob(null); setEditingJob(job); }}
            onResumeCreated={(jobId) => {
              setJobs((prev) =>
                prev.map((j) => j.id === jobId ? { ...j, has_resume: true } : j)
              );
            }}
          />
        )}

        {isEmpty && (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white mb-4">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              {t("warRoom.emptyState.title")}
            </h2>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {t("warRoom.emptyState.description")}
            </p>
          </div>
        )}

        <div
          className="sticky z-20 bg-gray-50 pb-2 -mx-6 px-6"
          style={{ top: "var(--app-header-height, 64px)" }}
        >
          <div className={`flex gap-4 pt-2 ${isEmpty ? "opacity-40" : ""}`}>
            {COLUMNS.map((col) => (
              <div
                key={col.id}
                className={`flex-1 min-w-[160px] flex items-center gap-2 px-1.5 pb-2 border-b-2 ${col.accentColor}`}
              >
                <span className="text-sm font-semibold text-gray-700">
                  {t(`warRoom.columns.${col.id}`)}
                </span>
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${col.badgeBg} ${col.badgeText}`}
                >
                  {(cardsByStatus[col.id] ?? []).length}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`flex gap-4 pt-3 pb-4 min-h-[calc(100vh-180px)] ${isEmpty ? "opacity-40 pointer-events-none select-none" : ""}`}
        >
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              col={col}
              cards={cardsByStatus[col.id] ?? []}
              draggingId={draggingId}
              dragOverColId={dragOverColId}
              openMenuId={openMenuId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={(colId) => setDragOverColId(colId)}
              onDragLeave={() => setDragOverColId(null)}
              onDrop={handleDrop}
              onMenuToggle={setOpenMenuId}
              onCardClick={setViewingJob}
              onEdit={setEditingJob}
              onDuplicate={handleDuplicate}
              onDeleteRequest={setDeletingJob}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
