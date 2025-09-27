import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export to enable Clerk
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  devIndicators: false
};

export default nextConfig;
