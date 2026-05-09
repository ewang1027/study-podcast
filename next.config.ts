import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    optimizePackageImports: ["@react-three/drei"],
  },
};

export default nextConfig;
