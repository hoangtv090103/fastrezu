import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabled for BlockNote compatibility
  images: {
    domains: ['*.supabase.co'],
  },
};

export default nextConfig;
