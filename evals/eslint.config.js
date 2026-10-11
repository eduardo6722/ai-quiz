import base from "@ai-quiz/config/eslint.config.js";
import { frameworkFreeImports, hexagonalBoundaries } from "@ai-quiz/config/eslint.config.js";

export default [{ ignores: ["**/*.cjs", "*.cjs"] }, ...base, hexagonalBoundaries, frameworkFreeImports];
