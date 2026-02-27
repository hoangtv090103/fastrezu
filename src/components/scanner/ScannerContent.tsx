"use client";

import { useState, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import Link from "next/link";
import FileUploadZone from "@/components/cv/FileUploadZone";
import { useTranslation } from "@/hooks/useTranslation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faArrowLeft,
  faCheckCircle,
  faFileWord,
  faFilePdf,
  faWandSparkles,
  faThumbsUp,
  faArrowUpRightFromSquare,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";
import type { CVEvaluationResult } from "@/app/api/ai/evaluate-cv/route";
import type { ExtractedProfile } from "@/app/api/ai/extract-profile-from-cv/route";
import VaultImportPanel from "./VaultImportPanel";

// Configure PDF.js worker — mirrors PDFViewer.tsx
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

type ScanStatus = "idle" | "processing" | "done" | "error";
type AIStatus = "idle" | "running" | "done" | "error";

interface ScanResult {
  pageImages: string[]; // Base64 JPEGs — only for PDF
  extractedText: string;
  fileType: "pdf" | "docx";
  pageCount: number;
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** SVG circular gauge — displays a 0-100 score as an arc */
function CircularGauge({
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
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const progress = score != null ? (score / 100) * circumference : 0;
  const strokeColor =
    score == null
      ? "#d1d5db"
      : score >= 75
        ? "#22c55e"
        : score >= 50
          ? "#f59e0b"
          : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Relative wrapper so the absolute score overlay is positioned inside the ring */}
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
        {/* Score number centred inside the ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl font-bold"
            style={{ color: score != null ? strokeColor : "#9ca3af" }}
          >
            {score != null ? score : "—"}
          </span>
        </div>
      </div>
      <span className="text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

/** Horizontal progress bar for a section score */
function SectionBar({
  label,
  score,
  feedback,
}: {
  label: string;
  score: number;
  feedback: string;
}) {
  const barColor =
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-800">{score}/100</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{feedback}</p>
    </div>
  );
}

/** Collapsible bullet list for strengths / improvements / tips */
function BulletList({
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

// ── Main Component ────────────────────────────────────────────────────────────

interface ScannerContentProps {
  existingVaultSections?: Record<string, unknown>;
  existingEnabledSections?: string[];
}

export default function ScannerContent({
  existingVaultSections = {},
  existingEnabledSections = [],
}: ScannerContentProps) {
  const { t, locale } = useTranslation();

  // Scan (6.1) state
  const [file, setFile] = useState<File | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

  // AI analysis (6.2 + 6.3) state — runs in parallel
  const [aiStatus, setAiStatus] = useState<AIStatus>("idle");
  const [evaluation, setEvaluation] = useState<CVEvaluationResult | null>(null);
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile | null>(null);
  const [aiError, setAiError] = useState("");

  const isPdf = file?.name.toLowerCase().endsWith(".pdf");

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setScanResult(null);
    setScanError("");
    setScanStatus("idle");
    setProcessingProgress(0);
    setEvaluation(null);
    setExtractedProfile(null);
    setAiStatus("idle");
    setAiError("");
  }, []);

  const renderPdfPages = async (
    arrayBuffer: ArrayBuffer,
  ): Promise<{ images: string[]; text: string }> => {
    const pdf = await pdfjs
      .getDocument({ data: new Uint8Array(arrayBuffer) })
      .promise;
    const images: string[] = [];
    const textParts: string[] = [];
    const SCALE = 1.5;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      images.push(canvas.toDataURL("image/jpeg", 0.85));

      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      textParts.push(pageText);

      setProcessingProgress(Math.round((i / pdf.numPages) * 100));
    }

    return { images, text: textParts.join("\n") };
  };

  const extractDocxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setScanStatus("processing");
    setScanError("");
    setProcessingProgress(0);
    setEvaluation(null);
    setExtractedProfile(null);
    setAiStatus("idle");

    try {
      const arrayBuffer = await file.arrayBuffer();

      if (isPdf) {
        const { images, text } = await renderPdfPages(arrayBuffer);
        setScanResult({
          pageImages: images,
          extractedText: text,
          fileType: "pdf",
          pageCount: images.length,
        });
      } else {
        setProcessingProgress(50);
        const text = await extractDocxText(arrayBuffer);
        setProcessingProgress(100);
        setScanResult({
          pageImages: [],
          extractedText: text,
          fileType: "docx",
          pageCount: 0,
        });
      }

      setScanStatus("done");
    } catch (err) {
      console.error("Scanner processing error:", err);
      setScanError(
        err instanceof Error ? err.message : t("scanner.errors.processingFailed"),
      );
      setScanStatus("error");
    }
  };

  /** Run 6.2 (evaluate) + 6.3 (extract profile) in parallel via Promise.all */
  const handleFullAnalysis = async () => {
    if (!scanResult) return;
    setAiStatus("running");
    setAiError("");

    const payload = {
      pageImages: scanResult.pageImages,
      extractedText: scanResult.extractedText,
      fileType: scanResult.fileType,
      locale,
    };

    const fetchJson = async <T,>(url: string): Promise<T> => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      return res.json() as Promise<T>;
    };

    try {
      const [evalResult, profileResult] = await Promise.all([
        fetchJson<CVEvaluationResult>("/api/ai/evaluate-cv"),
        fetchJson<ExtractedProfile>("/api/ai/extract-profile-from-cv"),
      ]);
      setEvaluation(evalResult);
      setExtractedProfile(profileResult);
      setAiStatus("done");
    } catch (err) {
      console.error("AI analysis error:", err);
      setAiError(
        err instanceof Error ? err.message : t("scanner.errors.evaluationFailed"),
      );
      setAiStatus("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setScanResult(null);
    setScanError("");
    setScanStatus("idle");
    setProcessingProgress(0);
    setEvaluation(null);
    setExtractedProfile(null);
    setAiStatus("idle");
    setAiError("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/dashboard/vault"
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title={t("scanner.backToVault")}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="w-6 h-6 text-indigo-600"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("scanner.title")}
            </h1>
          </div>
        </div>
        <p className="text-gray-600 text-sm sm:text-base ml-9">
          {t("scanner.subtitle")}
        </p>
      </div>

      {/* ── STEP 1 & 2: Upload + Processing ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
        {/* Idle / error: show upload form */}
        {(scanStatus === "idle" || scanStatus === "error") && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("scanner.uploadLabel")}
              </label>
              <FileUploadZone
                file={file}
                onFileSelect={handleFileSelect}
                accept=".pdf,.docx"
                maxSizeMB={10}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FontAwesomeIcon
                  icon={isPdf ? faFilePdf : faFileWord}
                  className={isPdf ? "text-red-500" : "text-blue-500"}
                />
                <span>
                  {isPdf
                    ? t("scanner.pdfDetected")
                    : t("scanner.docxDetected")}
                </span>
                {!isPdf && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    {t("scanner.docxLayoutNote")}
                  </span>
                )}
              </div>
            )}

            {scanError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{scanError}</p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {t("scanner.analyzeButton")}
            </button>
          </div>
        )}

        {/* Processing spinner */}
        {scanStatus === "processing" && (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-800">
                {t("scanner.processing")}
              </p>
              {isPdf && processingProgress > 0 && (
                <p className="text-sm text-gray-500">
                  {t("scanner.processingProgress", {
                    progress: processingProgress.toString(),
                  })}
                </p>
              )}
            </div>
            {isPdf && (
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Done: success banner + page thumbnails / text preview + evaluate CTA */}
        {scanStatus === "done" && scanResult && (
          <div className="space-y-6">
            {/* Success banner */}
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-green-500 w-5 h-5 flex-shrink-0"
              />
              <div>
                <p className="font-medium text-green-800">
                  {scanResult.fileType === "pdf"
                    ? t("scanner.doneSuccessPdf", {
                        pages: scanResult.pageCount.toString(),
                      })
                    : t("scanner.doneSuccessDocx")}
                </p>
                <p className="text-sm text-green-700 mt-0.5">
                  {t("scanner.doneSubtitle")}
                </p>
              </div>
            </div>

            {/* PDF page thumbnails */}
            {scanResult.fileType === "pdf" && scanResult.pageImages.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-3">
                  {t("scanner.pagesPreview", {
                    count: scanResult.pageImages.length.toString(),
                  })}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {scanResult.pageImages.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${t("scanner.page")} ${idx + 1}`}
                        className="w-full object-contain bg-white"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t("scanner.page")} {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DOCX text preview */}
            {scanResult.fileType === "docx" && (
              <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-3">
                  {t("scanner.extractedTextPreview")}
                </h2>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto font-sans">
                  {scanResult.extractedText || t("scanner.noTextFound")}
                </pre>
              </div>
            )}

            {/* Evaluate + Extract CTA (shown when not yet run) */}
            {aiStatus !== "done" && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  {t("scanner.uploadAnother")}
                </button>
                <button
                  onClick={handleFullAnalysis}
                  disabled={aiStatus === "running"}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors text-sm"
                >
                  <FontAwesomeIcon icon={faWandSparkles} className="w-4 h-4" />
                  {aiStatus === "running"
                    ? t("scanner.evaluating")
                    : t("scanner.evaluateButton")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── STEP 3: AI Analysis (evaluation + extraction) ── */}

      {/* Running spinner */}
      {aiStatus === "running" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col items-center py-10 space-y-5">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <FontAwesomeIcon
                icon={faRobot}
                className="absolute inset-0 m-auto w-6 h-6 text-indigo-400"
              />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-800">
                {t("scanner.evaluating")}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t("scanner.evaluationSubtitle")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI error */}
      {aiStatus === "error" && aiError && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 mb-6">
          <p className="text-sm text-red-600">{aiError}</p>
          <button
            onClick={handleFullAnalysis}
            className="mt-3 px-4 py-2 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            {t("scanner.evaluateAgain")}
          </button>
        </div>
      )}

      {/* AI done: show evaluation results */}
      {aiStatus === "done" && evaluation && (
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
            <div className="flex gap-2">
              <button
                onClick={handleFullAnalysis}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t("scanner.evaluateAgain")}
              </button>
              <button
                onClick={handleReset}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {t("scanner.uploadAnother")}
              </button>
            </div>
          </div>

          {/* ── Score gauges ── */}
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

          {/* ── Section scores ── */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              {t("scanner.sectionScores")}
            </h3>
            <div className="space-y-4">
              {(["contact", "summary", "experience", "skills", "education"] as const).map(
                (key) => (
                  <SectionBar
                    key={key}
                    label={t(`scanner.sections.${key}`)}
                    score={evaluation.sections[key].score}
                    feedback={evaluation.sections[key].feedback}
                  />
                ),
              )}
            </div>
          </div>

          {/* ── Strengths / Improvements / Tips ── */}
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
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5" />
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
      )}

      {/* ── STEP 4: Vault Import Panel (6.3) ── */}
      {aiStatus === "done" && extractedProfile && (
        <VaultImportPanel
          extractedProfile={extractedProfile}
          existingVaultSections={existingVaultSections}
          existingEnabledSections={existingEnabledSections}
        />
      )}
    </div>
  );
}
