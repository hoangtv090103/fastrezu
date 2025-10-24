"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Có lỗi xảy ra trong quá trình xác thực';
  
  // Check if it's an expired link error
  const isExpiredLink = message.includes('expired') || message.includes('invalid');
  
  return (
    <div className="max-w-md w-full">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl text-red-600">⚠️</span>
        </div>
        
        <h1 className="heading-main text-2xl text-gray-900 mb-4">
          Lỗi xác thực
        </h1>
        
        <p className="body-text text-gray-600 mb-4">
          {message}
        </p>
        
        {isExpiredLink && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800">
              <strong>Link đã hết hạn hoặc không hợp lệ.</strong> Magic link chỉ có hiệu lực trong 1 giờ. 
              Vui lòng yêu cầu gửi link mới.
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Link
            href="/login"
            className="btn-primary btn-text w-full block"
          >
            Thử lại
          </Link>
          
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 small-text"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
