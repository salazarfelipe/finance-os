import type { NextConfig } from "next";

// GitHub Pages de proyecto: salazarfelipe.github.io/finance-os
const BASE_PATH = "/finance-os";

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
  basePath: BASE_PATH,
  assetPrefix: `${BASE_PATH}/`,
  env: {
    // Assets estáticos (como sql-wasm.wasm) hay que pedirlos con el basePath a mano:
    // fetch()/indexedDB no pasan por el helper de Next que sí lo hace automáticamente.
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
};

export default nextConfig;
