"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles,
  faSpinner,
  faXmark,
  faTag,
  faRotateRight,
  faDownload,
  faPalette,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import TailoredCVPreview, {
  TailoredResumeData,
} from "@/components/cv/TailoredCVPreview";
import TemplateSelector from "@/components/cv/TemplateSelector";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabase";
import type { TemplateId, ColorTheme } from "@/components/cv/templates/shared/types";

// ── PDF Download hook ──────────────────────────────────────────────────────
function usePDFDownload() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const downloadPDF = useCallback(
    async (
      data: TailoredResumeData,
      language: "vi" | "en",
      fileName: string,
      errorMsg: string,
      templateId: TemplateId,
      colorTheme: ColorTheme
    ) => {
      setIsGenerating(true);
      setPdfError(null);
      try {
        const [{ default: TailoredCVTemplatePDF }, { pdf }] = await Promise.all([
          import("@/components/cv/TailoredCVTemplatePDF"),
          import("@react-pdf/renderer"),
        ]);
        const blob = await pdf(
          <TailoredCVTemplatePDF
            data={data}
            language={language}
            templateId={templateId}
            colorTheme={colorTheme}
          />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } catch (err) {
        console.error("PDF generation error:", err);
        setPdfError(errorMsg);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  return { isGenerating, pdfError, downloadPDF };
}

interface TailorResumeButtonProps {
  jobId: string;
  hasJd: boolean;
  /** Optional: pre-fetched resume snapshot from Server Component */
  initialResume?: {
    id: string;
    content_snapshot: TailoredResumeData | null;
    template_id?: string | null;
    color_theme?: string | null;
    created_at: string | null;
  } | null;
  /** Compact mode for toolbar use (modal toolbar) */
  compact?: boolean;
  /** Called after a resume is successfully tailored */
  onTailoredSuccess?: () => void;
}

// ── Tailoring Notes Banner ─────────────────────────────────────────────────
function TailoringNotesBanner({
  notes,
  t,
}: {
  notes: TailoredResumeData["tailoring_notes"];
  t: (key: string) => string;
}) {
  if (!notes) return null;
  const score = notes.estimated_match_score;
  const color =
    score >= 70 ? "bg-green-50 border-green-200 text-green-800" :
    score >= 40 ? "bg-amber-50 border-amber-200 text-amber-800" :
    "bg-red-50 border-red-200 text-red-800";

  return (
    <div className={`border rounded-xl px-4 py-3 mb-4 ${color}`}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5" />
          <span className="text-sm font-semibold">
            {t("warRoom.tailorResume.matchScore")}: {score}/100
          </span>
        </div>
        {notes.keywords_integrated.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <FontAwesomeIcon icon={faTag} className="w-3 h-3 opacity-70" />
            <span className="text-xs font-medium opacity-80">
              {t("warRoom.tailorResume.keywordsIntegrated")}:
            </span>
            {notes.keywords_integrated.slice(0, 8).map((kw) => (
              <span
                key={kw}
                className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-white/60 border border-current/20"
              >
                {kw}
              </span>
            ))}
            {notes.keywords_integrated.length > 8 && (
              <span className="text-xs opacity-70">
                +{notes.keywords_integrated.length - 8}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────
function PreviewModal({
  data,
  language,
  resumeId,
  onClose,
  onRetailor,
  isRetailoring,
  t,
  initialTemplateId,
  initialColorTheme,
}: {
  data: TailoredResumeData;
  language: "vi" | "en";
  resumeId: string | null;
  onClose: () => void;
  onRetailor: () => void;
  isRetailoring: boolean;
  t: (key: string) => string;
  initialTemplateId: TemplateId;
  initialColorTheme: ColorTheme;
}) {
  const { isGenerating: isPDFGenerating, pdfError, downloadPDF } = usePDFDownload();
  const [templateId, setTemplateId] = useState<TemplateId>(initialTemplateId);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(initialColorTheme);
  const [showSelector, setShowSelector] = useState(false);

  const handleDownload = useCallback(async () => {
    const name = data.personal?.full_name?.trim().replace(/\s+/g, "_") ?? "cv";
    const date = new Date().toISOString().slice(0, 10);
    await downloadPDF(
      data,
      language,
      `${name}_${templateId}_${date}.pdf`,
      t("warRoom.tailorResume.pdfError"),
      templateId,
      colorTheme
    );
    // Persist template/color choice to DB (best-effort)
    if (resumeId) {
      supabase
        .from("resumes")
        .update({ template_id: templateId, color_theme: colorTheme })
        .eq("id", resumeId)
        .then(({ error }) => {
          if (error) console.warn("Could not persist template choice:", error.message);
        });
    }
  }, [data, language, downloadPDF, t, templateId, colorTheme, resumeId]);

  // Escape key + scroll lock
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

  const modal = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faWandMagicSparkles}
              className="w-4 h-4 text-purple-500"
            />
            <span className="font-semibold text-gray-900">
              {t("warRoom.tailorResume.previewTitle")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Template/Color toggle */}
            <button
              onClick={() => setShowSelector((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faPalette} className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Template</span>
              <FontAwesomeIcon
                icon={showSelector ? faChevronUp : faChevronDown}
                className="w-2.5 h-2.5 opacity-60"
              />
            </button>

            {/* Download PDF button */}
            <button
              onClick={handleDownload}
              disabled={isPDFGenerating}
              title={t("warRoom.tailorResume.downloadPDF")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isPDFGenerating ? (
                <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isPDFGenerating
                  ? t("warRoom.tailorResume.generatingPDF")
                  : t("warRoom.tailorResume.downloadPDF")}
              </span>
            </button>

            {/* Re-tailor button */}
            <button
              onClick={onRetailor}
              disabled={isRetailoring}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {isRetailoring ? (
                <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faRotateRight} className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{t("warRoom.tailorResume.rerun")}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Template selector (collapsible) */}
        {showSelector && (
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
            <TemplateSelector
              selectedTemplate={templateId}
              selectedColor={colorTheme}
              onTemplateChange={setTemplateId}
              onColorChange={setColorTheme}
            />
          </div>
        )}

        {/* PDF error */}
        {pdfError && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-100 shrink-0">
            <p className="text-xs text-red-600">{pdfError}</p>
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">
          {/* Tailoring notes banner */}
          {data.tailoring_notes && (
            <TailoringNotesBanner notes={data.tailoring_notes} t={t} />
          )}

          {/* A4 shadow wrapper */}
          <div className="bg-gray-100 rounded-xl p-4">
            <div className="shadow-lg rounded-sm overflow-hidden">
              <TailoredCVPreview
                data={data}
                language={language}
                templateId={templateId}
                colorTheme={colorTheme}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : modal;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function TailorResumeButton({
  jobId,
  hasJd,
  initialResume,
  compact = false,
  onTailoredSuccess,
}: TailorResumeButtonProps) {
  const { t, locale } = useTranslation();
  const language = locale === "en" ? "en" : "vi";

  const [resume, setResume] = useState<TailoredResumeData | null>(
    (initialResume?.content_snapshot as TailoredResumeData) ?? null
  );
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<TemplateId>(
    (initialResume?.template_id as TemplateId) ?? "classic"
  );
  const [colorTheme, setColorTheme] = useState<ColorTheme>(
    (initialResume?.color_theme as ColorTheme) ?? "blue"
  );
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch existing resume from DB on mount (client-side, for modal usage)
  useEffect(() => {
    if (resume || initialResume !== undefined) return;
    supabase
      .from("resumes")
      .select("id, content_snapshot, template_id, color_theme, created_at")
      .eq("job_id", jobId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content_snapshot) {
          setResume(data.content_snapshot as TailoredResumeData);
          setResumeId(data.id);
          if (data.template_id) setTemplateId(data.template_id as TemplateId);
          if (data.color_theme) setColorTheme(data.color_theme as ColorTheme);
        }
      });
  }, [jobId, resume, initialResume]);

  const handleTailor = useCallback(async () => {
    setIsTailoring(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, language }),
      });
      const data = await res.json();
      if (res.ok) {
        const { resume_id, job_id: _j, ...cvSnapshot } = data;
        setResume(cvSnapshot as TailoredResumeData);
        if (resume_id) setResumeId(resume_id as string);
        setShowPreview(true);
        onTailoredSuccess?.();
      } else {
        setError(
          data.error ??
            t("warRoom.tailorResume.errors.failed")
        );
      }
    } catch {
      setError(t("warRoom.tailorResume.errors.connectionError"));
    } finally {
      setIsTailoring(false);
    }
  }, [jobId, language, t, onTailoredSuccess]);

  const hasResume = !!resume;

  if (compact) {
    return (
      <>
        <button
          onClick={hasResume ? () => setShowPreview(true) : handleTailor}
          disabled={isTailoring || !hasJd}
          title={
            !hasJd ? t("warRoom.tailorResume.noJDHint") : undefined
          }
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isTailoring ? (
            <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
          ) : (
            <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3 h-3" />
          )}
          {isTailoring
            ? t("warRoom.tailorResume.tailoring")
            : hasResume
            ? t("warRoom.tailorResume.viewResult")
            : t("warRoom.tailorResume.button")}
        </button>

        {showPreview && resume && (
          <PreviewModal
            data={resume}
            language={language}
            resumeId={resumeId}
            onClose={() => setShowPreview(false)}
            onRetailor={handleTailor}
            isRetailoring={isTailoring}
            t={t}
            initialTemplateId={templateId}
            initialColorTheme={colorTheme}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={hasResume ? () => setShowPreview(true) : handleTailor}
        disabled={isTailoring || !hasJd}
        title={!hasJd ? t("warRoom.tailorResume.noJDHint") : undefined}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all
          ${
            isTailoring || !hasJd
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : hasResume
              ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow-md"
              : "bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md"
          }`}
      >
        {isTailoring ? (
          <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5" />
        )}
        {isTailoring
          ? t("warRoom.tailorResume.tailoring")
          : hasResume
          ? t("warRoom.tailorResume.viewResult")
          : t("warRoom.tailorResume.button")}
      </button>

      {hasResume && !isTailoring && (
        <button
          onClick={handleTailor}
          disabled={!hasJd}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-medium text-purple-600 border border-purple-200 hover:bg-purple-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faRotateRight} className="w-3 h-3" />
          {t("warRoom.tailorResume.rerun")}
        </button>
      )}

      {!hasJd && (
        <p className="text-xs text-gray-400 text-center">
          {t("warRoom.tailorResume.noJDHint")}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {showPreview && resume && (
        <PreviewModal
          data={resume}
          language={language}
          resumeId={resumeId}
          onClose={() => setShowPreview(false)}
          onRetailor={handleTailor}
          isRetailoring={isTailoring}
          t={t}
          initialTemplateId={templateId}
          initialColorTheme={colorTheme}
        />
      )}
    </div>
  );
}
