import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the native pg driver out of the bundler; load it at runtime on the server.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
