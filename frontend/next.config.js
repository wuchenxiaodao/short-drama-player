/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  allowedDevOrigins: ['10.0.2.2'],
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8081';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/videos/:path*',
        destination: `${backendUrl}/videos/:path*`,
      },
      {
        source: '/covers/:path*',
        destination: `${backendUrl}/covers/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
