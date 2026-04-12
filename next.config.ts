import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    workerThreads: true,
    turbopackPluginRuntimeStrategy: "workerThreads",
  },
};

export default nextConfig;
