import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Covers are served at 90 so the optimizer doesn't blur fine print on them
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
