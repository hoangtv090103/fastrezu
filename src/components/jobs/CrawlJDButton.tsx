"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/hooks/useTranslation";

interface CrawlJDButtonProps {
  jobId: string;
  variant?: "primary" | "ghost";
}

export default function CrawlJDButton({
  jobId,
  variant = "primary",
}: CrawlJDButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isCrawling, setIsCrawling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCrawl = async () => {
    setIsCrawling(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/crawl-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh(); // Re-fetch Server Component data
      } else {
        setError(data.error ?? t("warRoom.jobDetail.errors.crawlFailed"));
      }
    } catch {
      setError(t("warRoom.jobDetail.errors.connectionError"));
    } finally {
      setIsCrawling(false);
    }
  };

  const isPrimary = variant === "primary";

  return (
    <div>
      <button
        type="button"
        onClick={handleCrawl}
        disabled={isCrawling}
        className={
          isPrimary
            ? "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            : "flex items-center gap-1.5 px-2.5 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
        }
      >
        {isCrawling ? (
          <FontAwesomeIcon
            icon={faSpinner}
            className={
              isPrimary ? "w-3.5 h-3.5 animate-spin" : "w-3 h-3 animate-spin"
            }
          />
        ) : (
          <FontAwesomeIcon
            icon={faLink}
            className={isPrimary ? "w-3.5 h-3.5" : "w-3 h-3"}
          />
        )}
        {isCrawling
          ? isPrimary
            ? t("warRoom.jobDetail.fetchingFromUrl")
            : t("warRoom.jobDetail.updatingJD")
          : isPrimary
            ? t("warRoom.jobDetail.fetchFromUrl")
            : t("warRoom.jobDetail.updateJD")}
      </button>
      {error && <p className="text-xs text-amber-600 mt-1.5">{error}</p>}
    </div>
  );
}
