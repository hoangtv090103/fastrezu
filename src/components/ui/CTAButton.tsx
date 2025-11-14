"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { useTranslation } from "@/hooks/useTranslation";

interface CTAButtonProps {
  variant?: "primary" | "secondary";
}

export default function CTAButton({ variant = "primary" }: CTAButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleClick = () => {
    if (isAuthenticated) {
      // If already logged in, redirect to dashboard
      router.push("/dashboard");
    } else {
      // If not logged in, redirect to login page
      router.push("/login");
    }
  };

  const buttonClass =
    variant === "primary"
      ? "btn-primary btn-text w-full sm:w-auto inline-block text-center whitespace-nowrap px-6 py-3"
      : "btn-secondary btn-text w-full sm:w-auto inline-block text-center whitespace-nowrap px-6 py-3";

  const textAlignClass = variant === "primary" ? "lg:text-left" : "";

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={buttonClass}
      >
        {isLoading ? "..." : t("ctaButton.cta")}
      </button>
      <p className={`small-text text-gray-500 text-center ${textAlignClass} mt-3`}>
        {isAuthenticated
          ? t("ctaButton.continueDashboard")
          : t("ctaButton.loginOrRegister")}
      </p>
    </>
  );
}
