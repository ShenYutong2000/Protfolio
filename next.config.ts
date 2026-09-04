import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  devIndicators: false,
  async redirects() {
    return [{ source: "/education", destination: "/teaching", permanent: true }];
  },
};

export default nextConfig;
