/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'export',
  // Set API URL for deployment (can be overridden by env var)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  },
  // Explicitly tell Turbopack which workspace root to use so Next
  // doesn't infer the wrong root when multiple lockfiles exist.
  // Use the frontend directory (this file's directory) as root.
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;

