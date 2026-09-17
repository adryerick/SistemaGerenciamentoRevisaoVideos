import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  serverExternalPackages: ["ffmpeg-static"],
  // Multipart overhead must also fit; Proxy otherwise truncates uploads at 10 MB.
  experimental: { proxyClientMaxBodySize: "260mb" },
};

export default nextConfig;
