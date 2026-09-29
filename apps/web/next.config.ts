import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ballast/domain", "@ballast/ui", "@ballast/rules"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_ORIGIN ?? "http://localhost:4000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
