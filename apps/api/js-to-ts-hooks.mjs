import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".js") && context.parentURL?.startsWith("file:")) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const asTs = path.resolve(parentDir, specifier.replace(/\.js$/u, ".ts"));
    if (existsSync(asTs)) {
      return { shortCircuit: true, url: pathToFileURL(asTs).href };
    }
  }
  return nextResolve(specifier, context);
}
