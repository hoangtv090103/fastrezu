"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClockRotateLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/hooks/useTranslation";
import type { ScanHistoryItem } from "@/app/api/cv/scan-history/route";

interface Props {
  history: ScanHistoryItem[];
}

function ScoreBadge({
  score,
  label,
  color,
}: {
  score: number | null;
  label: string;
  color: string;
}) {
  if (score == null) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border"
      style={{ borderColor: `${color}40`, backgroundColor: `${color}15`, color }}
    >
      {label}: {score}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ScanHistoryPanel({ history }: Props) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mt-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <FontAwesomeIcon icon={faClockRotateLeft} className="text-gray-400 w-4 h-4" />
        <h2 className="text-base font-semibold text-gray-800">
          {t("scanner.history.title")}
        </h2>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between py-3 gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {item.file_name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(item.scanned_at)}
              </p>
            </div>

            {/* Score badges */}
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
              <ScoreBadge score={item.overall_score} label="Overall" color="#6366f1" />
              <ScoreBadge score={item.ats_score} label="ATS" color="#3b82f6" />
              <ScoreBadge score={item.design_score} label="Design" color="#8b5cf6" />
            </div>

            {/* Detail link */}
            <Link
              href={`/dashboard/scanner/history/${item.id}`}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap flex-shrink-0"
            >
              {t("scanner.history.viewDetail")}
              <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
