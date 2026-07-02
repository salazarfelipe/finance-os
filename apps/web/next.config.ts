import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    "@finance-os/domain",
    "@finance-os/application",
    "@finance-os/database",
    "@finance-os/ui",
    "@finance-os/shared",
  ],
  // GitHub Pages de proyecto: salazarfelipe.github.io/finance-os
  basePath: "/finance-os",
  assetPrefix: "/finance-os/",
};

export default nextConfig;
