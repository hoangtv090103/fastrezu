import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import FeedbackButton from "@/components/ui/FeedbackButton";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { LanguageProvider } from "@/contexts/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title:
    "FastRezu - AI-Powered CV Optimization for ATS Systems | Sending 50 CVs, Getting 0 Responses?",
  description:
    "FastRezu is an AI-powered tool that helps you optimize your CV specifically for job descriptions. Not just beautiful CVs, but CVs that get seen by recruiters. JD analysis, keyword suggestions, and multilingual CV content creation.",
  keywords:
    "CV, ATS, AI, resume writing, job search, FastRezu, recruitment, interview, keywords, JD analyzer, CV optimization, resume builder",
  openGraph: {
    title:
      "FastRezu - AI-Powered CV Optimization for ATS Systems | Sending 50 CVs, Getting 0 Responses?",
    description:
      "FastRezu is an AI-powered tool that helps you optimize your CV specifically for job descriptions. Not just beautiful CVs, but CVs that get seen by recruiters.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <LanguageProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#4ade80",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
          {/* Show feedback button on public pages */}
          <FeedbackButton />
        </LanguageProvider>
        {process.env.NODE_ENV === "production" && process.env.VERCEL && (
          <Analytics />
        )}
        {process.env.NODE_ENV === "production" && process.env.VERCEL && (
          <SpeedInsights />
        )}
      </body>
    </html>
  );
}
