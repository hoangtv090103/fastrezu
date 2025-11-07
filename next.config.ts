import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabled for BlockNote compatibility
  images: {
    domains: ['*.supabase.co', 'vietnamworks.com', 'www.vietnamworks.com'],
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimize bundle size
  experimental: {
    optimizePackageImports: ['@blocknote/react', '@blocknote/core'],
  },
};

export default nextConfig;
