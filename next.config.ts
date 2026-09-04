import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  agentRules: false,
  devIndicators: false,
};

export default nextConfig;
