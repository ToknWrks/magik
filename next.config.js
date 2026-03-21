/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/coaching',
        destination: '/spiritual-coaching',
        permanent: true,
      },
      {
        source: '/coaching/:path*',
        destination: '/spiritual-coaching/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig
