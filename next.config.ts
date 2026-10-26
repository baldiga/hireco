import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // hireco.help is the main domain. The old vercel.app host keeps serving /api for existing extension installs.
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.hireco.help" }], destination: "https://hireco.help/:path*", permanent: true },
      { source: "/:path((?!api/).*)", has: [{ type: "host", value: "hireco-seven.vercel.app" }], destination: "https://hireco.help/:path", permanent: true },
    ];
  },
};

export default nextConfig;
