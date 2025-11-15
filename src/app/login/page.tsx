"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useTranslation } from "@/hooks/useTranslation";
import MagicLinkForm from "@/components/auth/MagicLinkForm";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import Image from "next/image";

function LoginContent() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleMagicLink = async (email: string) => {
    setIsLoading(true);
    setMessage("");

    try {
      // Detect if user is on mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Use environment variable for production, fallback to window.location.origin for development
      // Configure NEXT_PUBLIC_SITE_URL in .env.local for your environment:
      // - Development: http://localhost:3000
      // - Production: https://yourdomain.com
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      
      // For mobile, use the callback URL that will handle deep link
      // For desktop/web, use the standard callback URL
      const redirectUrl = `${siteUrl}/auth/callback`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          // Add shouldCreateUser option to handle new users
          shouldCreateUser: true,
        },
      });

      if (error) {
        // Enhanced error messages for better UX
        let errorMessage = t('login.errors.generic');
        
        // Rate limit error (429)
        if (error.message.includes("security purposes") || error.message.includes("second")) {
          errorMessage = t('login.errors.rateLimit');
        } 
        // Invalid email format
        else if (error.message.includes("invalid") || error.message.includes("email")) {
          errorMessage = t('login.errors.invalidEmail');
        }
        // Network errors
        else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = t('login.errors.network');
        }
        // Server errors
        else if (error.message.includes("500") || error.message.includes("server")) {
          errorMessage = t('login.errors.server');
        }
        
        setMessage(errorMessage);
        console.error("Magic link error:", error);
      } else {
        setMessage(
          isMobile 
            ? t('login.success.mobile')
            : t('login.success.desktop')
        );
      }
    } catch (error) {
      setMessage(t('login.errors.unexpected'));
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
                {t('landing.header.brandName')}
              </span>
            </div>
            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h1 className="heading-main text-3xl text-gray-900 mb-2">
                {t('login.title')}
              </h1>
              <p className="body-text text-gray-600">
                {t('login.subtitle')}
              </p>
            </div>

            <MagicLinkForm
              onSubmit={handleMagicLink}
              isLoading={isLoading}
              message={message}
            />

            <div className="mt-6 text-center">
              <p className="small-text text-gray-500">
                {t('login.noAccountMessage')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <LoginContent />
  );
}
