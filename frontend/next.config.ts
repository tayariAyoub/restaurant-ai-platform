import type { NextConfig } from "next";

const configuredBackendUrl = process.env.BACKEND_INTERNAL_URL?.trim();
const fallbackBackendUrl = process.env.VERCEL ? "" : "http://localhost:8000";
const backendProxyUrl = (configuredBackendUrl || fallbackBackendUrl).replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    if (!backendProxyUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendProxyUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendProxyUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
