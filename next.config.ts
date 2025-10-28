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
};

export default nextConfig;
