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
      {
        // Photos uploaded in the admin (Vercel Blob)
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        // VinoShipper label art for ciders without a local render
        protocol: 'https',
        hostname: 'img-production-vinoshipper.s3.amazonaws.com',
      },
    ],
  },
  // Old URLs from the pre-redesign site. Permanent so search engines follow.
  async redirects() {
    return [
      { source: '/shop/cidery', destination: '/cider', permanent: true },
      { source: '/shop/lavender', destination: '/lavender', permanent: true },
      { source: '/contact', destination: '/visit', permanent: true },
      { source: '/salt-cedar-bnb', destination: '/stay', permanent: true },
      { source: '/products', destination: '/lavender', permanent: true },
    ];
  },
};

export default nextConfig;
