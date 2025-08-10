import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use a different dist directory to avoid Windows file locks on .next/trace
  distDir: ".next-build",
};

export default nextConfig;
