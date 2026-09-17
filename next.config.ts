import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  serverExternalPackages: ["ffmpeg-static"],
};

export default nextConfig;
