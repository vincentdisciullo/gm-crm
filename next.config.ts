import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Large spreadsheet imports are sent to a server action in one request.
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
