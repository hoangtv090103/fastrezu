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
  faRobot,
} from "@fortawesome/free-solid-svg-icons";
import type { CVEvaluationResult } from "@/app/api/ai/evaluate-cv/route";
import type { ExtractedProfile } from "@/app/api/ai/extract-profile-from-cv/route";
import type { ScanHistoryItem } from "@/app/api/cv/scan-history/route";
import EvaluationResultsView from "./EvaluationResultsView";
import VaultImportPanel from "./VaultImportPanel";
import ScanHistoryPanel from "./ScanHistoryPanel";

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

// ── Main Component ────────────────────────────────────────────────────────────

interface ScannerContentProps {
  existingVaultSections?: Record<string, unknown>;
  existingEnabledSections?: string[];
  initialHistory?: ScanHistoryItem[];
}

export default function ScannerContent({
  existingVaultSections = {},
  existingEnabledSections = [],
  initialHistory = [],
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

  // History — starts with server-fetched list, prepend on new save
  const [history, setHistory] = useState<ScanHistoryItem[]>(initialHistory);

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

  /** Run 6.2 (evaluate) + 6.3 (extract profile) in parallel, then save to history */
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

      // Non-blocking: save to history (failure must not block the user)
      fetch("/api/cv/scan-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file?.name ?? "CV",
          evaluation: evalResult,
          extracted_profile: profileResult,
        }),
      })
        .then((res) => res.json())
        .then((saved: { id?: string }) => {
          if (saved.id) {
            // Prepend optimistic entry to history list
            setHistory((prev) => [
              {
                id: saved.id!,
                file_name: file?.name ?? "CV",
                overall_score: evalResult.overall_score ?? null,
                ats_score: evalResult.ats_score ?? null,
                design_score: evalResult.design_score ?? null,
                scanned_at: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        })
        .catch((err) => console.warn("Failed to save scan history:", err));
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

      {/* ── STEP 3: AI running spinner ── */}
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

      {/* ── STEP 3: AI Evaluation results ── */}
      {aiStatus === "done" && evaluation && (
        <EvaluationResultsView
          evaluation={evaluation}
          onRerun={handleFullAnalysis}
          onReset={handleReset}
        />
      )}

      {/* ── STEP 4: Vault Import Panel (6.3) ── */}
      {aiStatus === "done" && extractedProfile && (
        <VaultImportPanel
          extractedProfile={extractedProfile}
          existingVaultSections={existingVaultSections}
          existingEnabledSections={existingEnabledSections}
        />
      )}

      {/* ── STEP 5: Scan History (6.4) ── */}
      {history.length > 0 && <ScanHistoryPanel history={history} />}
    </div>
  );
}
