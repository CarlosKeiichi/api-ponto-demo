import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [{ source: "/aula", destination: "/aula/index.html" }];
  },
};

export default nextConfig;
