import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FastRezu - AI tối ưu CV cho hệ thống ATS | Gửi 50 CV, nhận 0 phản hồi?",
  description:
    "FastRezu là công cụ AI chuyên sâu giúp bạn tối ưu CV chuẩn theo từng mô tả công việc. Không chỉ CV đẹp, mà là CV được nhà tuyển dụng nhìn thấy. Phân tích JD, gợi ý từ khóa, soạn thảo nội dung CV bằng tiếng Việt.",
  keywords: "CV, ATS, AI, viết CV, tìm việc, FastRezu, ứng tuyển, phỏng vấn, từ khóa, JD analyzer, tối ưu CV",
  openGraph: {
    title: "FastRezu - AI tối ưu CV cho hệ thống ATS | Gửi 50 CV, nhận 0 phản hồi?",
    description:
      "FastRezu là công cụ AI chuyên sâu giúp bạn tối ưu CV chuẩn theo từng mô tả công việc. Không chỉ CV đẹp, mà là CV được nhà tuyển dụng nhìn thấy.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {process.env.NODE_ENV === 'production' && process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}
