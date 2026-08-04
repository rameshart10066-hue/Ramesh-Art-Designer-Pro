import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: [
      "node_modules", "dist", ".next",
      "src/__tests__/manufacturing/**",
    ],
    testTimeout: 30000,
    logHeapUsage: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
