/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    formats: ['image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  // Optimize for Nigeria networks
  output: 'standalone',
};

module.exports = nextConfig;
