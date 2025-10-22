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
        <Analytics />
      </body>
    </html>
  );
}
