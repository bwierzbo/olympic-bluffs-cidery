import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow the shop to request lighter, right-sized images (cards don't need q75).
    qualities: [65, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'items-images-production.s3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'items-images-sandbox.s3.us-west-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
};

export default nextConfig;
