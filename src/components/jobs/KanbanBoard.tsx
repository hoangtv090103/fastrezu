"use client";

import { useState } from "react";
import AddJobModal from "./AddJobModal";
import type { NewJobCard } from "@/app/(authenticated)/dashboard/jobs/actions";
import { updateJobStatus } from "@/app/(authenticated)/dashboard/jobs/actions";

// ── Types ──────────────────────────────────────────────────────────────
export interface JobCard {
  id: string;
  title: string;
  company_name: string;
  status: string | null;
  created_at: string | null;
  job_url: string | null;
}

interface KanbanBoardProps {
  initialJobs: JobCard[];
}

// ── Column definitions ─────────────────────────────────────────────────
const COLUMNS: {
  id: string;
  label: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  emptyLabel: string;
}[] = [
  {
    id: "saved",
    label: "Đã lưu",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    dotColor: "bg-blue-500",
    emptyLabel: "Lưu job để bắt đầu",
  },
  {
    id: "optimized",
    label: "Đã tối ưu",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    dotColor: "bg-purple-500",
    emptyLabel: "Thả thẻ vào đây",
  },
  {
    id: "applied",
    label: "Đã nộp",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-700",
    dotColor: "bg-yellow-500",
    emptyLabel: "Thả thẻ vào đây",
  },
  {
    id: "interviewing",
    label: "Phỏng vấn",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    dotColor: "bg-orange-500",
    emptyLabel: "Thả thẻ vào đây",
  },
  {
    id: "offer",
    label: "Offer",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    dotColor: "bg-green-500",
    emptyLabel: "Thả thẻ vào đây",
  },
  {
    id: "rejected",
    label: "Từ chối",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    dotColor: "bg-red-500",
    emptyLabel: "Thả thẻ vào đây",
  },
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

// ── Column ──────────────────────────────────────────────────────────────
interface KanbanColumnProps {
  col: (typeof COLUMNS)[number];
  cards: JobCard[];
  draggingId: string | null;
  dragOverColId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: (colId: string) => void;
  onDragLeave: () => void;
  onDrop: (colId: string) => void;
}

function KanbanColumn({
  col,
  cards,
  draggingId,
  dragOverColId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: KanbanColumnProps) {
  const isOver = dragOverColId === col.id;

  return (
    <div className="flex flex-col min-w-[220px] w-[220px]">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-sm font-semibold text-gray-700">{col.label}</span>
        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${col.badgeBg} ${col.badgeText}`}
        >
          {cards.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver(col.id);
        }}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          onDrop(col.id);
        }}
        className={`flex flex-col gap-2 flex-1 rounded-xl p-1.5 min-h-[80px] transition-colors
          ${isOver ? "bg-blue-50 ring-2 ring-blue-300 ring-dashed" : ""}`}
      >
        {cards.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors
              ${isOver ? "border-blue-400" : "border-gray-200"}`}
          >
            <p className="text-xs text-gray-400">{col.emptyLabel}</p>
          </div>
        ) : (
          cards.map((job) => (
            <div
              key={job.id}
              draggable
              onDragStart={() => onDragStart(job.id)}
              onDragEnd={onDragEnd}
              className={`bg-white border border-gray-200 rounded-xl p-3 transition-all select-none
                cursor-grab active:cursor-grabbing hover:border-blue-200 hover:shadow-sm
                ${draggingId === job.id ? "opacity-40 scale-95" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">
                    {job.company_name}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2 leading-snug">
                    {job.title}
                  </p>
                </div>
                <span
                  className={`shrink-0 w-2 h-2 rounded-full mt-1 ${col.dotColor}`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {formatDate(job.created_at)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Board ───────────────────────────────────────────────────────────
export default function KanbanBoard({ initialJobs }: KanbanBoardProps) {
  const [jobs, setJobs] = useState<JobCard[]>(initialJobs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

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

  const handleDragStart = (id: string) => setDraggingId(id);

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColId(null);
  };

  const handleDrop = (targetColId: string) => {
    if (!draggingId) return;

    const currentStatus =
      jobs.find((j) => j.id === draggingId)?.status ?? "saved";

    if (targetColId === currentStatus) {
      setDraggingId(null);
      setDragOverColId(null);
      return;
    }

    const idToDrop = draggingId;
    // Optimistic update
    setJobs((prev) =>
      prev.map((j) =>
        j.id === idToDrop ? { ...j, status: targetColId } : j,
      ),
    );
    setDraggingId(null);
    setDragOverColId(null);

    // Persist to DB (fire-and-forget)
    updateJobStatus(idToDrop, targetColId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">War Room</h1>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi tiến trình ứng tuyển của bạn
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Thêm Job
          </button>
        </div>

        <AddJobModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onJobAdded={handleJobAdded}
        />

        {/* Empty state (no jobs at all) */}
        {isEmpty && (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              Chưa có job nào
            </h2>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              Bấm &ldquo;+ Thêm Job&rdquo; để lưu JD đầu tiên và bắt đầu theo
              dõi quá trình ứng tuyển.
            </p>
          </div>
        )}

        {/* Kanban board */}
        <div
          className={`flex gap-4 overflow-x-auto pb-4 ${isEmpty ? "mt-6 opacity-40 pointer-events-none select-none" : ""}`}
        >
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              col={col}
              cards={cardsByStatus[col.id] ?? []}
              draggingId={draggingId}
              dragOverColId={dragOverColId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={(colId) => setDragOverColId(colId)}
              onDragLeave={() => setDragOverColId(null)}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
