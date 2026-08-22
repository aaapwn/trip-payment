import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the traced files needed at runtime,
  // so the Docker image does not need node_modules. See Dockerfile.
  output: 'standalone',
};

export default nextConfig;
