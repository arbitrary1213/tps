/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    unoptimized: true,
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  env: {
    API_BASE: process.env.API_BASE || '',
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || '',
  },

  experimental: {
    optimizeCss: false,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  headers: async () => [
    {
      source: '/:all*(svg|jpg|png|ico|woff2)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
      ],
    },
  ],
}

module.exports = nextConfig
