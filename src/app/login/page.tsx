"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useTranslation } from "@/hooks/useTranslation";
import MagicLinkForm from "@/components/auth/MagicLinkForm";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import CVPreviewPane from "@/components/cv/CVPreviewPane";
import { getPendingCV, PendingCV } from "@/lib/pending-cv-storage";
import Image from "next/image";

function LoginContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingCV, setPendingCV] = useState<PendingCV | null>(null);
  const supabase = createClient();

  // Check for pending CV on mount
  const hasPendingCVParam = searchParams.get("pending_cv") === "true";

  useEffect(() => {
    if (hasPendingCVParam) {
      const cv = getPendingCV();
      setPendingCV(cv);
    }
  }, [hasPendingCVParam]);

  const showSplitView = hasPendingCVParam && pendingCV;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      // Add from_upload flag if there's a pending CV
      const callbackUrl = pendingCV
        ? `${siteUrl}/auth/callback?from_upload=true`
        : `${siteUrl}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setMessage(error.message);
        console.error("Google login error:", error);
      }
    } catch (error) {
      setMessage(t("login.errors.unexpected"));
      console.error("Google login error:", error);
    }
  };

  const handleMagicLink = async (email: string) => {
    setIsLoading(true);
    setMessage("");

    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      // Add from_upload flag if there's a pending CV
      const redirectUrl = pendingCV
        ? `${siteUrl}/auth/callback?from_upload=true`
        : `${siteUrl}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: true,
        },
      });

      if (error) {
        let errorMessage = t("login.errors.generic");

        if (
          error.message.includes("security purposes") ||
          error.message.includes("second")
        ) {
          errorMessage = t("login.errors.rateLimit");
        } else if (
          error.message.includes("invalid") ||
          error.message.includes("email")
        ) {
          errorMessage = t("login.errors.invalidEmail");
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorMessage = t("login.errors.network");
        } else if (
          error.message.includes("500") ||
          error.message.includes("server")
        ) {
          errorMessage = t("login.errors.server");
        }

        setMessage(errorMessage);
        console.error("Magic link error:", error);
      } else {
        setMessage(
          isMobile ? t("login.success.mobile") : t("login.success.desktop")
        );
      }
    } catch (error) {
      setMessage(t("login.errors.unexpected"));
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login Form Component - conditional styling for split vs default view
  const LoginForm = () => (
    <div className={showSplitView ? "" : "bg-white rounded-2xl shadow-2xl p-8"}>
      <div className="text-center mb-8">
        <h1 className="heading-main text-3xl text-gray-900 mb-2">
          {showSplitView ? "Đăng nhập để tiếp tục" : t("login.title")}
        </h1>
        <p className="body-text text-gray-600">
          {showSplitView
            ? "Đăng nhập để xem điểm ATS và gợi ý cải thiện CV của bạn"
            : t("login.subtitle")}
        </p>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 mb-6 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="font-medium text-gray-700 group-hover:text-gray-900">
          {t("auth.loginWithGoogle")}
        </span>
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            {t("auth.loginWithMagicLink")}
          </span>
        </div>
      </div>

      <MagicLinkForm
        onSubmit={handleMagicLink}
        isLoading={isLoading}
        message={message}
      />

      <div className="mt-6 text-center">
        <p className="small-text text-gray-500">
          {t("login.noAccountMessage")}
        </p>
      </div>
    </div>
  );

  // Split View Layout (with CV preview) - Rezi-inspired design
  if (showSplitView) {
    return (
      <div className="min-h-screen h-screen flex overflow-hidden">
        {/* Left Side - Login Form (clean white, no card) */}
        <div className="w-full lg:w-[45%] bg-white flex flex-col relative">
          {/* Header */}
          <header className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image
                  src="/fastrezu-logo/trans_bg.png"
                  alt="FastRezu Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                  priority
                />
                <span className="heading-feature text-xl text-gray-900">
                  {t("landing.header.brandName")}
                </span>
              </div>
              <LanguageSwitcher />
            </div>
          </header>

          {/* Form Container - Clean, no card shadow */}
          <div className="flex-1 flex items-center justify-center px-8 lg:px-16">
            <div className="max-w-sm w-full">
              <LoginForm />
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-px bg-gray-200" />
        </div>

        {/* Right Side - CV Preview (very light gray) */}
        <div className="hidden lg:flex lg:w-[55%] bg-gray-50 items-center justify-center overflow-hidden p-8">
          <CVPreviewPane pendingCV={pendingCV} />
        </div>
      </div>
    );
  }

  // Default Single Column Layout
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Image
                src="/fastrezu-logo/trans_bg.png"
                alt="FastRezu Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                priority
              />
              <span className="heading-feature text-xl text-gray-900">
                {t("landing.header.brandName")}
              </span>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
