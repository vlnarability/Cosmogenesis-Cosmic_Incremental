import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  // Memory optimization — Turbopack config (Next.js 16 default bundler)
  turbopack: {
    // Reduce memory by limiting module resolution scope
    resolveAlias: {
      // Stub out unused heavy packages to reduce bundle size
    },
  },
};

export default nextConfig;
