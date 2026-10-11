import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KNOWN_FILE_EXT = /\.(?:js|ts|mjs|cjs|json|node)$/u;

export async function resolve(specifier, context, nextResolve) {
  if (context.parentURL?.startsWith("file:")) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    if (specifier.endsWith(".js")) {
      const asTs = path.resolve(parentDir, specifier.replace(/\.js$/u, ".ts"));
      if (existsSync(asTs)) {
        return { shortCircuit: true, url: pathToFileURL(asTs).href };
      }
    }
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && !KNOWN_FILE_EXT.test(specifier)) {
      const asTs = path.resolve(parentDir, `${specifier}.ts`);
      if (existsSync(asTs)) {
        return { shortCircuit: true, url: pathToFileURL(asTs).href };
      }
    }
  }
  return nextResolve(specifier, context);
}
