/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  allowedDevOrigins: ['10.0.2.2'],
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
}

module.exports = nextConfig
