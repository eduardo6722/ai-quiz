import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import path, { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

for (const candidate of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
  if (existsSync(candidate)) {
    loadEnv({ path: candidate });
    break;
  }
}

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  transpilePackages: ["@ai-quiz/ui", "@ai-quiz/contracts"],
  // Contracts uses NodeNext `.js` specifiers that point at TypeScript sources.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
