/** @type {import('next').NextConfig} */

// =================================================================
//  START: DIAGNOSTIC LOGS
// =================================================================
console.log("--- Initializing next.config.js ---");
try {
  // Log the Node.js version the build server is using
  console.log("Node.js version:", process.version);

  // Check for the existence of the 'next' package and log its version
  const nextPackageJson = require('next/package.json');
  console.log("Next.js version found in node_modules:", nextPackageJson.version);
} catch (error) {
  console.error("Could not read Next.js package version:", error.message);
}
console.log("--- End of diagnostic logs ---");
// =================================================================
//  END: DIAGNOSTIC LOGS
// =================================================================

const nextConfig = {
  // THIS IS THE FIX THAT MAKES DEPLOYMENT TO FIREBASE WORK
  output: 'standalone',

  /* Your existing config options are kept */
  devIndicators: {
    buildActivity: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;