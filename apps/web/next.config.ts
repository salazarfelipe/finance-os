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
  // Si se despliega como GitHub Pages de proyecto (usuario.github.io/finance-os),
  // hay que descomentar y ajustar basePath/assetPrefix con el nombre real del repo.
  // basePath: "/finance-os",
  // assetPrefix: "/finance-os/",
};

export default nextConfig;
