"use client";

import { User } from "@supabase/supabase-js";
import LogoutButton from "@/components/auth/LogoutButton";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import type { UserProfile } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

interface AuthenticatedHeaderProps {
  user: User;
  userProfile?: UserProfile | null;
}

export default function AuthenticatedHeader({
  user,
  userProfile,
}: AuthenticatedHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Get user initials from email
  const getUserInitials = (email: string) => {
    const name = email.split("@")[0];
    return name.substring(0, 2).toUpperCase();
  };

  // Format subscription tier: replace _ with space and capitalize words
  const formatSubscriptionTier = (tier: string) => {
    return tier
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative z-99">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Image
                src="/fastrezu-logo/trans_bg.png"
                alt="FastRezu Logo"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="heading-feature text-xl text-gray-900">
                FastRezu
              </span>
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 small-text transition-colors duration-200"
              >
                {t("navigation.manageCVs")}
              </Link>
              <Link
                href="/check-cv"
                className="text-gray-600 hover:text-gray-900 small-text transition-colors duration-200"
              >
                {t("navigation.checkCV")}
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {getUserInitials(user.email || "")}
                  </span>
                </div>
                <div className="hidden sm:block text-left max-w-32">
                  <p className="small-text text-gray-900 font-medium truncate">
                    {user.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userProfile?.subscription_tier
                      ? formatSubscriptionTier(userProfile.subscription_tier)
                      : "Beta Free"}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 break-all">
                      {user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {userProfile?.subscription_tier
                        ? formatSubscriptionTier(
                            userProfile.subscription_tier
                          ) + " Plan"
                        : "Beta Free Plan"}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/feedback"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <svg
                        className="w-4 h-4 mr-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      {t("navigation.sendFeedback")}
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 py-1">
                    <LogoutButton />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
