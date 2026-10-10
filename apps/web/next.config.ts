import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

for (const candidate of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
  if (existsSync(candidate)) {
    loadEnv({ path: candidate });
    break;
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ["@ai-quiz/ui", "@ai-quiz/contracts"],
};

export default nextConfig;
