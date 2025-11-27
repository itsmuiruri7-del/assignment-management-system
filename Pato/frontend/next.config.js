/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Set API URL for deployment (can be overridden by env var)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  },
};

module.exports = nextConfig;

