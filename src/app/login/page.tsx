"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import MagicLinkForm from "@/components/auth/MagicLinkForm";

function LoginContent() {
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
        setMessage("Có lỗi xảy ra khi gửi email. Vui lòng thử lại.");
        console.error("Magic link error:", error);
      } else {
        setMessage(
          isMobile 
            ? "Chúng tôi đã gửi link đăng nhập đến email của bạn. Nhấp vào link trong email để đăng nhập trên thiết bị di động của bạn."
            : "Chúng tôi đã gửi link đăng nhập đến email của bạn. Vui lòng kiểm tra hộp thư."
        );
      }
    } catch (error) {
      setMessage("Có lỗi xảy ra. Vui lòng thử lại.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="heading-main text-3xl text-gray-900 mb-2">
              Chào mừng đến với FastRezu
            </h1>
            <p className="body-text text-gray-600">
              Đăng nhập để bắt đầu tạo CV được tối ưu cho ATS
            </p>
          </div>

          <MagicLinkForm
            onSubmit={handleMagicLink}
            isLoading={isLoading}
            message={message}
          />

          <div className="mt-6 text-center">
            <p className="small-text text-gray-500">
              Chưa có tài khoản? Chúng tôi sẽ tạo tài khoản cho bạn khi bạn đăng
              nhập lần đầu.
            </p>
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
