"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CVPreviewCard from "./CVPreviewCard";
import CreateCVModal from "./CreateCVModal";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";
import { apiDelete } from "@/lib/api-client";
import { useTranslation } from "@/hooks/useTranslation";

interface CVSection {
  section_type: string;
  data: Record<string, unknown>;
  order_index: number;
}

interface CV {
  id: string;
  title: string;
  ats_score: number;
  language: "vi" | "en";
  updated_at: string;
  created_at: string;
  cv_sections: CVSection[];
}

interface DashboardContentProps {
  cvs: CV[];
}

export default function DashboardContent({ cvs }: DashboardContentProps) {
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const router = useRouter();
  const { t, locale } = useTranslation();

  const handleCreateCVClick = () => {
    setShowLanguageModal(true);
  };

  const handleDeleteCV = async (cvId: string) => {
    if (!confirm(t("dashboard.deleteConfirm"))) return;

    try {
      await apiDelete(`/api/cv/${cvId}/delete`, undefined, locale);
      showSuccessToast(t("dashboard.cvDeleted"));
      router.refresh();
    } catch (error) {
      console.error("Error deleting CV:", error);
      const appError = handleAPIError(error, "delete CV", locale);
      showErrorToast(appError, locale);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="heading-main text-3xl text-gray-900 mb-2">
          {t("dashboard.title")}
        </h1>
        <p className="body-text text-gray-600">{t("dashboard.subtitle")}</p>
      </div>

      <div className="mb-6">
        <button
          onClick={handleCreateCVClick}
          className="btn-primary btn-text disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("dashboard.createNewCV")}
        </button>
      </div>

      {cvs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📄</span>
          </div>
          <h2 className="heading-feature text-xl text-gray-900 mb-4">
            {t("dashboard.noCV")}
          </h2>
          <p className="body-text text-gray-600 mb-6 max-w-md mx-auto">
            {t("dashboard.noCVDescription")}
          </p>
          <button
            onClick={handleCreateCVClick}
            className="btn-primary btn-text disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("dashboard.createFirstCV")}
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => (
            <CVPreviewCard key={cv.id} cv={cv} onDelete={handleDeleteCV} />
          ))}
        </div>
      )}

      <CreateCVModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </div>
  );
}
