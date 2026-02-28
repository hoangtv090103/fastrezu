"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/hooks/useTranslation";

export default function BackToJobsLink() {
  const { t } = useTranslation();
  return (
    <Link
      href="/dashboard/jobs"
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
    >
      <FontAwesomeIcon icon={faArrowLeft} className="w-3.5 h-3.5" />
      {t("warRoom.backToList")}
    </Link>
  );
}
