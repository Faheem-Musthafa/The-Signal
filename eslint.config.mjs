import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Tool config files (postcss, convex auth, etc.) conventionally export an anonymous object.
    files: ["**/*.config.{js,mjs,cjs,ts,mts}"],
    rules: { "import/no-anonymous-default-export": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "convex/_generated/**",
    ".agents/**",
    ".claude/**",
    ".convex/**",
  ]),
]);
