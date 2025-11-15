"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface MagicLinkFormProps {
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
  message: string;
}

export default function MagicLinkForm({
  onSubmit,
  isLoading,
  message,
}: MagicLinkFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;
    await onSubmit(email);
  };

  // Check if message is an error (works for both languages)
  const isError = message && (
    message.includes("lỗi") || 
    message.includes("error") || 
    message.includes("Lỗi") ||
    message.includes("Error")
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {t('login.emailLabel')}
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('login.emailPlaceholder')}
          className="email-input w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm hover:border-gray-400 transition-colors duration-200"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !email}
        className="btn-primary btn-text w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t('login.sending') : t('login.sendLink')}
      </button>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            isError
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-green-50 text-green-700 border border-green-200"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}
