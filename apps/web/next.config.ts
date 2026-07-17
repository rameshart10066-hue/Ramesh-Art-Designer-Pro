import type { NextConfig } from "next";

/**
 * Next.js configuration for the Ramesh Art Designer Pro web app.
 *
 * `transpilePackages` is required because our internal @ramesh/* workspace
 * packages ship raw TypeScript source (not pre-built dist output) — Next.js
 * needs to transpile them itself rather than treating them as pre-compiled
 * node_modules.
 */
const nextConfig: NextConfig = {
  transpilePackages: [
    "@ramesh/design-engine",
    "@ramesh/manufacturing-engine",
    "@ramesh/ai-engine",
    "@ramesh/api-contracts",
    "@ramesh/database",
  ],
};

export default nextConfig;
