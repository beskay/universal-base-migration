/** @type {import('next').NextConfig} */
const path = require('path');
// Try to require dotenv-webpack, but don't fail if it's not installed
let Dotenv;
try {
  Dotenv = require('dotenv-webpack');
} catch (e) {
  console.warn('dotenv-webpack not installed, using default env config');
}

const nextConfig = {
  reactStrictMode: true,
  // Disable static optimization completely
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    
    // Add dotenv-webpack plugin to use root .env file
    if (Dotenv) {
      config.plugins.push(
        new Dotenv({
          path: path.resolve(__dirname, '../.env'), // Path to root .env file
          systemvars: true, // Load system environment variables as well
        })
      );
    }
    
    return config;
  },
  // Use a different approach to disable SSR
  experimental: {
    // This disables automatic static optimization
    disableOptimizedLoading: true,
  },
};

module.exports = nextConfig;
