"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faPen,
  faBuilding,
  faLink,
  faCalendar,
  faArrowUpRightFromSquare,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import type { JobCard } from "./KanbanBoard";
import JobAnalysisSection from "./JobAnalysisSection";
import TailorResumeButton from "./TailorResumeButton";
import { useTranslation } from "@/hooks/useTranslation";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface JobDetailModalProps {
  job: JobCard;
  onClose: () => void;
  onEdit: (job: JobCard) => void;
  onResumeCreated?: (jobId: string) => void;
}

export default function JobDetailModal({
  job,
  onClose,
  onEdit,
  onResumeCreated,
}: JobDetailModalProps) {
  const { t } = useTranslation();

  // Status config uses i18n keys
  const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
    saved:        { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500" },
    optimized:    { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
    applied:      { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
    interviewing: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
    offer:        { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500" },
    rejected:     { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500" },
  };

  const status = job.status ?? "saved";
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.saved;

  const [jdText, setJdText] = useState(job.raw_jd_text ?? "");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);

  const handleCrawl = async () => {
    setIsCrawling(true);
    setCrawlError(null);
    try {
      const res = await fetch("/api/jobs/crawl-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (res.ok && data.raw_jd_text) {
        setJdText(data.raw_jd_text);
      } else {
        setCrawlError(data.error ?? t("warRoom.jobDetail.errors.crawlFailed"));
      }
    } catch {
      setCrawlError(t("warRoom.jobDetail.errors.connectionError"));
    } finally {
      setIsCrawling(false);
    }
  };

  // Escape key + lock body scroll
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            {t("warRoom.jobDetail.title")}
          </span>
          <div className="flex items-center gap-1">
            <TailorResumeButton
              jobId={job.id}
              hasJd={!!job.raw_jd_text}
              compact
              onTailoredSuccess={onResumeCreated ? () => onResumeCreated(job.id) : undefined}
            />
            <Link
              href={`/dashboard/jobs/${job.id}`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
              title={t("warRoom.jobDetail.expand")}
            >
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
              <span className="hidden sm:inline">{t("warRoom.jobDetail.expand")}</span>
            </Link>
            <button
              onClick={() => { onEdit(job); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
              {t("warRoom.jobDetail.edit")}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Title + compact meta ── */}
        <div className="px-6 pb-4 shrink-0 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 leading-snug mb-2">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faBuilding} className="w-3.5 h-3.5 text-gray-400" />
              {job.company_name}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {t(`warRoom.columns.${status}`)}
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5" />
              {formatDate(job.created_at)}
            </span>
            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <FontAwesomeIcon icon={faLink} className="w-3.5 h-3.5" />
                {t("warRoom.jobDetail.viewOriginal")}
              </a>
            )}
          </div>
        </div>

        {/* ── Body: single scroll area, right column sticky ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 pb-6 pt-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_288px] gap-5">

            {/* Left: JD content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {t("warRoom.jobDetail.jobDescription")}
                </h2>
                {jdText && job.job_url && (
                  <button
                    type="button"
                    onClick={handleCrawl}
                    disabled={isCrawling}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isCrawling ? (
                      <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                    ) : (
                      <FontAwesomeIcon icon={faLink} className="w-3 h-3" />
                    )}
                    {isCrawling ? t("warRoom.jobDetail.updatingJD") : t("warRoom.jobDetail.updateJD")}
                  </button>
                )}
              </div>

              {crawlError && (
                <p className="text-xs text-amber-600 mb-2">{crawlError}</p>
              )}

              {jdText ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl px-4 py-4">
                  {jdText}
                </div>
              ) : (
                <div className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10">
                  {job.job_url ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-400 mb-3">
                        {t("warRoom.jobDetail.noJD")}
                      </p>
                      {crawlError && (
                        <p className="text-xs text-amber-600 mb-2">{crawlError}</p>
                      )}
                      <button
                        type="button"
                        onClick={handleCrawl}
                        disabled={isCrawling}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isCrawling ? (
                          <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FontAwesomeIcon icon={faLink} className="w-3.5 h-3.5" />
                        )}
                        {isCrawling ? t("warRoom.jobDetail.fetchingFromUrl") : t("warRoom.jobDetail.fetchFromUrl")}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center">
                      {t("warRoom.jobDetail.noJD")} {t("warRoom.jobDetail.noJDNoUrl").split(t("warRoom.jobDetail.noJD")).pop()?.split(t("warRoom.jobDetail.edit"))[0]}
                      <button
                        onClick={() => { onEdit(job); onClose(); }}
                        className="text-blue-500 hover:underline"
                      >
                        {t("warRoom.jobDetail.edit")}
                      </button>{" "}
                      {t("warRoom.addJobModal.jdText").split("(")[0].trim().toLowerCase().includes("để thêm") ? "" : t("warRoom.jobDetail.addJDorUrl").split(t("warRoom.jobDetail.edit")).pop()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right: AI analysis — sticky so it stays visible while scrolling JD */}
            <div className="lg:sticky lg:top-0 self-start">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <JobAnalysisSection
                  jobId={job.id}
                  hasJd={!!jdText}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
