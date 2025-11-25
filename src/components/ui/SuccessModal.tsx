"use client";

import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCVEditor } from "@/contexts/CVEditorContext";
import { apiPost, type RetryConfig } from "@/lib/api-client";
import { useTranslation } from "@/hooks/useTranslation";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { state, updateCVData } = useCVEditor();
  const [isScoring, setIsScoring] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  // Initialize score from CV data
  useEffect(() => {
    if (state.cvData?.ats_score) {
      setScore(state.cvData.ats_score);
    }
  }, [state.cvData?.ats_score]);

  const handleScoreCV = useCallback(async () => {
    if (!state.cvData || isScoring || score !== null) return;

    setIsScoring(true);
    try {
      // Custom retry config with extended timeout for AI scoring
      const scoreRetryConfig: RetryConfig = {
        maxRetries: 2,
        backoffMs: 1000,
        timeoutMs: 120000,
        retryableStatuses: [429, 500, 502, 503, 504],
      };

      const result = await apiPost<{
        score: number;
        analysis: {
          keyword_match: number;
          formatting: number;
          completeness: number;
          relevance: number;
          matched_keywords: string[];
          missing_keywords: string[];
          suggestions: string[];
        };
        matchedKeywords: string[];
        missingKeywords: string[];
        suggestions: unknown[];
      }>(
        "/api/ai/score-cv",
        {
          cvData: state.cvData,
          jdKeywords: state.cvData.jd_analysis?.keywords || [],
          language: state.cvData?.language || "vi",
          mode: state.cvData.jd_analysis?.mode || "real",
        },
        scoreRetryConfig,
        "vi"
      );

      const newScore = Math.round(result.score || 0);
      setScore(newScore);

      // Update CV data with new score
      if (state.cvData) {
        updateCVData({
          ...state.cvData,
          ats_score: newScore,
          ats_analysis: result.analysis,
        });
      }
    } catch (error) {
      console.error("Failed to score CV:", error);
    } finally {
      setIsScoring(false);
    }
  }, [state.cvData, isScoring, score, updateCVData]);

  useEffect(() => {
    if (isOpen) {
      // Trigger scoring if needed
      if (!state.cvData?.ats_score && !score && !isScoring) {
        handleScoreCV();
      }

      // --- 1. Trigger Confetti ---
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#2563eb", "#22c55e", "#f59e0b"], // Blue, Green, Yellow
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#2563eb", "#22c55e", "#f59e0b"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // --- 2. Trigger Sound ---
      const playSuccessSound = async () => {
        try {
          const audio = new Audio("/sounds/success.mp3");
          audio.volume = 0.4; // Moderate volume (0.0 to 1.0)
          await audio.play();
        } catch (err) {
          // Browser might block autoplay if no interaction,
          // but since user just clicked "Complete", it usually works.
          console.warn("Could not play sound:", err);
        }
      };

      playSuccessSound();
    }
  }, [isOpen, handleScoreCV, state.cvData?.ats_score, score, isScoring]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all scale-100 animate-bounce-small">
        {/* Icon Success */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t("successModal.title")}
        </h2>

        {/* ATS Score Display */}
        <div className="my-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">
            {t("successModal.atsScore")}
          </div>
          {isScoring ? (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-sm text-blue-600 font-medium animate-pulse">
                {t("successModal.scoring")}
              </span>
            </div>
          ) : score !== null ? (
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-4xl font-bold ${
                  score >= 80
                    ? "text-green-600"
                    : score >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {score}
              </span>
              <span className="text-gray-400 text-xl">/ 100</span>
            </div>
          ) : (
            <div className="text-gray-400 italic">
              {t("successModal.noScore")}
            </div>
          )}
        </div>

        {/* Reassurance Message */}
        <p className="text-gray-600 mb-8">
          {t("successModal.savedMessage")}{" "}
          <span className="font-semibold text-green-600">
            {t("successModal.saved")}
          </span>{" "}
          {t("successModal.savedMessageSuffix")}
          <br />
          {t("successModal.wish")}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              {t("successModal.continue")}
            </button>
            <Link
              href="/dashboard" // Or create new link if available
              className="flex items-center justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02]"
            >
              {t("successModal.createNew")}
            </Link>
          </div>
        </div>

        {/* Close absolute button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
