"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faBolt,
  faTag,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";

// ── Types ──────────────────────────────────────────────────────────────
interface JobAnalysis {
  keywords_required: string[];
  match_score: number;
  gap_analysis: string;
}

interface JobAnalysisSectionProps {
  jobId: string;
  hasJd: boolean;
  /** Pre-fetched analysis (from Server Component). If null, will attempt client-side fetch. */
  initialAnalysis?: JobAnalysis | null;
}

// ── Match Score SVG Gauge ───────────────────────────────────────────────
function MatchScoreGauge({ score }: { score: number }) {
  const { t } = useTranslation();
  const r = 38;
  const circ = 2 * Math.PI * r;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const offset = circ * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        {/* Track */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="9"
        />
        {/* Progress */}
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        {/* Score text */}
        <text
          x="50"
          y="46"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize="20"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {score}
        </text>
        <text
          x="50"
          y="63"
          textAnchor="middle"
          fontSize="10"
          fill="#9ca3af"
          fontFamily="system-ui, sans-serif"
        >
          / 100
        </text>
      </svg>
      <p className="text-xs font-medium text-gray-500">
        {t("warRoom.aiAnalysis.matchScore")}
      </p>
    </div>
  );
}

// ── Keyword Tag ─────────────────────────────────────────────────────────
function KeywordBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
      {label}
    </span>
  );
}

// ── Main Component ──────────────────────────────────────────────────────
export default function JobAnalysisSection({
  jobId,
  hasJd,
  initialAnalysis,
}: JobAnalysisSectionProps) {
  const { t, locale } = useTranslation();
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(
    initialAnalysis ?? null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(!!initialAnalysis);

  // Fetch existing analysis from DB on mount (only if not pre-fetched)
  useEffect(() => {
    if (fetched) return;
    supabase
      .from("job_analyses")
      .select("keywords_required, match_score, gap_analysis")
      .eq("job_id", jobId)
      .maybeSingle()
      .then(
        ({
          data,
        }: {
          data: {
            keywords_required: string[] | null;
            match_score: number | null;
            gap_analysis: string | null;
          } | null;
        }) => {
          if (data) {
            setAnalysis({
              keywords_required: data.keywords_required ?? [],
              match_score: data.match_score ?? 0,
              gap_analysis: data.gap_analysis ?? "",
            });
          }
          setFetched(true);
        },
      );
  }, [jobId, fetched]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, locale }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnalysis({
          keywords_required: data.keywords_required ?? [],
          match_score: data.match_score ?? 0,
          gap_analysis: data.gap_analysis ?? "",
        });
      } else {
        setError(data.error || t("warRoom.aiAnalysis.errors.analysisFailed"));
      }
    } catch {
      setError(t("warRoom.aiAnalysis.errors.connectionError"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const buttonLabel = isAnalyzing
    ? t("warRoom.aiAnalysis.analyzing")
    : analysis
      ? t("warRoom.aiAnalysis.reanalyze")
      : t("warRoom.aiAnalysis.analyze");

  return (
    <div className="space-y-4">
      {/* Section header + action button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <FontAwesomeIcon
            icon={faBolt}
            className="w-3.5 h-3.5 text-yellow-500"
          />
          {t("warRoom.aiAnalysis.title")}
        </h2>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !hasJd}
        title={!hasJd ? t("warRoom.aiAnalysis.noJDHint") : undefined}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all
          ${
            isAnalyzing || !hasJd
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
          }`}
      >
        {isAnalyzing ? (
          <FontAwesomeIcon
            icon={faSpinner}
            className="w-3.5 h-3.5 animate-spin"
          />
        ) : (
          <FontAwesomeIcon icon={faBolt} className="w-3.5 h-3.5" />
        )}
        {buttonLabel}
      </button>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* No JD hint */}
      {!hasJd && (
        <p className="text-xs text-gray-400 text-center">
          {t("warRoom.aiAnalysis.noJDHint")}
        </p>
      )}

      {/* Analysis results */}
      {analysis && (
        <div className="space-y-4">
          {/* Match score gauge */}
          <div className="bg-gray-50 rounded-xl p-4 flex justify-center">
            <MatchScoreGauge score={analysis.match_score} />
          </div>

          {/* Gap analysis */}
          {analysis.gap_analysis && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faFileLines}
                  className="w-3 h-3 text-gray-400"
                />
                {t("warRoom.aiAnalysis.gapAnalysis")}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {analysis.gap_analysis}
              </p>
            </div>
          )}

          {/* Keywords */}
          {analysis.keywords_required.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <FontAwesomeIcon
                  icon={faTag}
                  className="w-3 h-3 text-gray-400"
                />
                {t("warRoom.aiAnalysis.keywords")} (
                {analysis.keywords_required.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keywords_required.map((kw) => (
                  <KeywordBadge key={kw} label={kw} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
