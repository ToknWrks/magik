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
      {
        source: '/chakra-sound',
        destination: '/chakra-toner',
        permanent: true,
      },
      {
        source: '/onboarding-02',
        destination: '/illuminati-initiation',
        permanent: true,
      },
      {
        source: '/onboarding-03',
        destination: '/full-illuminati-initiation',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig
