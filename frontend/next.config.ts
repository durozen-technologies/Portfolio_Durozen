import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  devIndicators: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;


