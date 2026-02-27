"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandSparkles,
  faThumbsUp,
  faArrowUpRightFromSquare,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/hooks/useTranslation";
import type { CVEvaluationResult } from "@/app/api/ai/evaluate-cv/route";

// ── Shared display primitives (exported for potential reuse) ──────────────────

export function CircularGauge({
  score,
  label,
  color = "#6366f1",
  size = 120,
}: {
  score: number | null;
  label: string;
  color?: string;
  size?: number;
}) {
  const normalizedScore =
    score != null && Number.isFinite(score) ? score : null;
  const clampedScore =
    normalizedScore != null
      ? Math.min(100, Math.max(0, normalizedScore))
      : null;

  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const progress =
    clampedScore != null ? (clampedScore / 100) * circumference : 0;
  const strokeColor =
    clampedScore == null
      ? "#d1d5db"
      : clampedScore >= 75
        ? "#22c55e"
        : clampedScore >= 50
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={8}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl font-bold"
            style={{ color: clampedScore != null ? strokeColor : "#9ca3af" }}
          >
            {clampedScore != null ? clampedScore : "—"}
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

export function SectionBar({
  label,
  score,
  feedback,
}: {
  label: string;
  score: number;
  feedback: string;
}) {
  const normalizedScore = Number.isFinite(score) ? score : 0;
  const clampedScore = Math.min(100, Math.max(0, normalizedScore));
  const barColor =
    clampedScore >= 75
      ? "bg-green-500"
      : clampedScore >= 50
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-800">{clampedScore}/100</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-700`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{feedback}</p>
    </div>
  );
}

export function BulletList({
  items,
  variant,
}: {
  items: string[];
  variant: "green" | "amber" | "blue";
}) {
  const dotColor =
    variant === "green"
      ? "bg-green-500"
      : variant === "amber"
        ? "bg-amber-400"
        : "bg-blue-500";
  const textColor =
    variant === "green"
      ? "text-green-700"
      : variant === "amber"
        ? "text-amber-700"
        : "text-blue-700";

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span
            className={`${dotColor} w-2 h-2 rounded-full mt-1.5 flex-shrink-0`}
          />
          <span className={`text-sm ${textColor}`}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface EvaluationResultsViewProps {
  evaluation: CVEvaluationResult;
  /** If provided, shows "Re-run" button */
  onRerun?: () => void;
  /** If provided, shows "Upload another" button */
  onReset?: () => void;
}

export default function EvaluationResultsView({
  evaluation,
  onRerun,
  onReset,
}: EvaluationResultsViewProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-8 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FontAwesomeIcon
            icon={faWandSparkles}
            className="text-indigo-500 w-5 h-5"
          />
          {t("scanner.evaluationDone")}
        </h2>
        {(onRerun || onReset) && (
          <div className="flex gap-2">
            {onRerun && (
              <button
                onClick={onRerun}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t("scanner.evaluateAgain")}
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t("scanner.uploadAnother")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Score gauges */}
      <div className="flex justify-center gap-8 sm:gap-16 flex-wrap">
        <CircularGauge
          score={evaluation.overall_score}
          label={t("scanner.overallScore")}
          size={128}
        />
        <CircularGauge
          score={evaluation.ats_score}
          label={t("scanner.atsScore")}
          color="#3b82f6"
          size={128}
        />
        {evaluation.design_score != null ? (
          <CircularGauge
            score={evaluation.design_score}
            label={t("scanner.designScore")}
            color="#8b5cf6"
            size={128}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative flex items-center justify-center rounded-full border-4 border-gray-200"
              style={{ width: 128, height: 128 }}
            >
              <span className="text-gray-400 text-2xl font-bold">—</span>
            </div>
            <span className="text-xs text-gray-400 text-center max-w-24">
              {t("scanner.designScoreUnavailable")}
            </span>
          </div>
        )}
      </div>

      {/* Section scores */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          {t("scanner.sectionScores")}
        </h3>
        <div className="space-y-4">
          {(
            ["contact", "summary", "experience", "skills", "education"] as const
          ).map((key) => (
            <SectionBar
              key={key}
              label={t(`scanner.sections.${key}`)}
              score={evaluation.sections[key].score}
              feedback={evaluation.sections[key].feedback}
            />
          ))}
        </div>
      </div>

      {/* Strengths / Improvements / Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <h3 className="text-sm font-semibold text-green-800 flex items-center gap-1.5 mb-3">
            <FontAwesomeIcon icon={faThumbsUp} className="w-3.5 h-3.5" />
            {t("scanner.strengths")}
          </h3>
          <BulletList items={evaluation.strengths} variant="green" />
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-1.5 mb-3">
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              className="w-3.5 h-3.5"
            />
            {t("scanner.improvements")}
          </h3>
          <BulletList items={evaluation.improvements} variant="amber" />
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-1.5 mb-3">
            <FontAwesomeIcon icon={faRobot} className="w-3.5 h-3.5" />
            {t("scanner.atsTips")}
          </h3>
          <BulletList items={evaluation.ats_tips} variant="blue" />
        </div>
      </div>
    </div>
  );
}
