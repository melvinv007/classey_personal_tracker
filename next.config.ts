import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
    ],

    proxyClientMaxBodySize: 100 * 1024 * 1024, // 100MB
  },
};

export default nextConfig;