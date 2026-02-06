/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    formats: ['image/webp'],
  },
  // Disable optimizeCss experimental feature that requires critters
  experimental: {
    // optimizeCss: true,  // Disabled - requires critters package
  },
  compress: true,
  poweredByHeader: false,
  // Set output to standalone for better Netlify compatibility
  output: 'standalone',
};

module.exports = nextConfig;
