import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude pg from Edge runtime
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  // Disable Turbopack - use webpack instead (fixes Windows symlink issues with Prisma)
  // Keep webpack config for non-Turbopack builds
  webpack: (config, { isServer }) => {
    // Exclude pg and related packages from Edge runtime bundling
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pg: false,
        "pg-native": false,
        "pg-pool": false,
        "pg-connection-string": false,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
