import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  devIndicators: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.min.mjs': 'pdfjs-dist/build/pdf.worker.min.mjs',
    };
    return config;
  },
};

export default nextConfig;
