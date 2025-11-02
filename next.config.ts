import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabled for BlockNote compatibility
  images: {
    domains: ['*.supabase.co'],
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimize bundle size
  experimental: {
    optimizePackageImports: ['@blocknote/react', '@blocknote/core', 'react-pdf', 'pdfjs-dist'],
  },
  webpack: (config, { isServer }) => {
    // Chỉ áp dụng cho server-side (API routes và Server Components)
    if (isServer) {
      config.externals = [
        ...config.externals,
        '@sparticuz/chromium',
        'puppeteer-core',
        'unpdf', // Cho /upload-check
        'mammoth' // Cho /upload-check
      ];
    }
    return config;
  },
};

export default nextConfig;
