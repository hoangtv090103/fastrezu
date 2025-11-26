"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils";
import { handleAPIError } from "@/lib/error-handler";
import { apiPost } from "@/lib/api-client";
import { useTranslation } from "@/hooks/useTranslation";

interface CreateCVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCVModal({ isOpen, onClose }: CreateCVModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"vi" | "en">("vi");
  const [cvTitle, setCvTitle] = useState("");
  const router = useRouter();
  const { t, locale } = useTranslation();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCvTitle("");
      setSelectedLanguage("vi");
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleCreateCV = async () => {
    setIsCreating(true);
    try {
      const { cvId } = await apiPost<{ cvId: string }>(
        "/api/cv/create",
        {
          title: cvTitle.trim() || `CV ${selectedLanguage.toUpperCase()}`,
          language: selectedLanguage,
        },
        undefined,
        locale
      );
      showSuccessToast(t("dashboard.cvCreated"));
      router.push(`/editor/${cvId}`);
    } catch (error) {
      console.error("Error creating CV:", error);
      const appError = handleAPIError(error, "create CV", locale);
      showErrorToast(appError, locale);
    } finally {
      setIsCreating(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="heading-feature text-lg text-gray-900 mb-4">
          {t("dashboard.createNewCV")}
        </h3>

        {/* Title Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {t("dashboard.cvName")}
          </label>
          <input
            type="text"
            value={cvTitle}
            onChange={(e) => setCvTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200"
            placeholder={`CV ${selectedLanguage.toUpperCase()}`}
            autoFocus
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            {t("dashboard.selectLanguage")}
          </label>
          <p className="body-text text-gray-700 mb-4">
            {t("dashboard.languageNote")}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {/* Vietnamese Option */}
          <div
            className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedLanguage === "vi"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedLanguage("vi")}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  selectedLanguage === "vi"
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {selectedLanguage === "vi" && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {t("dashboard.vietnamese")}
                </h4>
                <p className="text-sm text-gray-600">
                  {t("dashboard.createInVietnamese")}
                </p>
              </div>
              <div className="ml-auto text-xl font-semibold text-gray-500">
                VN
              </div>
            </div>
          </div>

          {/* English Option */}
          <div
            className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedLanguage === "en"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedLanguage("en")}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  selectedLanguage === "en"
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {selectedLanguage === "en" && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {t("dashboard.english")}
                </h4>
                <p className="text-sm text-gray-600">
                  {t("dashboard.createInEnglish")}
                </p>
              </div>
              <div className="ml-auto text-xl font-semibold text-gray-500">
                EN
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleCreateCV}
            disabled={isCreating}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isCreating ? t("dashboard.creating") : t("dashboard.createCV")}
          </button>
        </div>
      </div>
    </div>
  );
}
