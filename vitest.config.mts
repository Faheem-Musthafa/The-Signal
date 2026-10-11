import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
          exclude: ["tests/convex/**"],
        },
      },
      {
        // Convex functions run under convex-test, which expects the edge runtime.
        extends: true,
        test: {
          name: "convex",
          environment: "edge-runtime",
          include: ["tests/convex/**/*.test.ts"],
          server: { deps: { inline: ["convex-test"] } },
        },
      },
    ],
  },
});
