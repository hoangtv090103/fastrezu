"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faDownload, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  signedUrl: string | null;
  fileName: string;
  fileStoragePath: string;
}

export default function ScanFileViewer({ signedUrl, fileName, fileStoragePath }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const isPdf = fileStoragePath.toLowerCase().endsWith(".pdf");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-sm font-medium text-gray-700 truncate">{fileName}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Preview toggle (PDF only) */}
          {isPdf && signedUrl && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="w-3 h-3" />
              {expanded ? t("scanner.history.viewOriginalCV") : t("scanner.history.viewOriginalCV")}
            </button>
          )}

          {/* Download button */}
          {signedUrl ? (
            <a
              href={signedUrl}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
            >
              <FontAwesomeIcon icon={faDownload} className="w-3 h-3" />
              {t("scanner.history.downloadCV")}
            </a>
          ) : (
            <span className="text-xs text-gray-400">{t("scanner.history.noFileAttached")}</span>
          )}
        </div>
      </div>

      {/* Inline PDF preview */}
      {isPdf && signedUrl && expanded && (
        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200" style={{ height: "75vh" }}>
          <iframe
            src={signedUrl}
            title={fileName}
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
}
