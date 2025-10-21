import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
  title: "FastRezu - AI viết CV chuẩn ATS",
  description:
    "Công cụ AI đầu tiên giúp bạn viết CV chuẩn ATS, tăng X3 cơ hội được gọi phỏng vấn. Phân tích mô tả công việc, gợi ý từ khóa, và tự động viết nội dung CV bằng tiếng Việt.",
  keywords: "CV, ATS, AI, viết CV, tìm việc, FastRezu, ứng tuyển",
  openGraph: {
    title: "FastRezu - AI viết CV chuẩn ATS",
    description:
      "Công cụ AI đầu tiên giúp bạn viết CV chuẩn ATS, tăng X3 cơ hội được gọi phỏng vấn.",
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
        <Analytics />
      </body>
    </html>
  );
}
