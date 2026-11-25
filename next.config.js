/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/+$/, '');
    return [{ source: '/media/:path*', destination: backendUrl + '/media/:path*' }];
  },
};

module.exports = nextConfig;
