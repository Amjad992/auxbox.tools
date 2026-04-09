/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  compress: true, // Enable gzip compression

  // Optimize CSS and JS
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Custom headers for caching and performance
  async headers() {
    return [
      {
        source: '/assets/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  redirects: async () => {
    return [
      {
        source: '/:path*',
        has: [{type: 'host', value: 'www.auxbox.tools'}],
        destination: 'https://auxbox.tools/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{type: 'header', key: 'x-forwarded-proto', value: 'http'}],
        destination: 'https://auxbox.tools/:path*',
        permanent: true,
      },

      {
        source: '/cgpaCalculator',
        destination: '/cgpa-calculator',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
