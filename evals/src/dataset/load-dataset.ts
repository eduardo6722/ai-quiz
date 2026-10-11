import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { goldenDatasetSchema, type GoldenCase, type GoldenDataset } from "./schema.js";
import { sha256File } from "./checksum.js";
import { findEvalsRoot } from "./paths.js";

export type CaseLoadError = {
  caseId: string;
  detail: "checksum-mismatch" | "missing-pin";
};

export type LoadedGoldenDataset = {
  dataset: GoldenDataset;
  pins: Map<string, string>;
  errors: CaseLoadError[];
};

export function loadGoldenDataset(options: { evalsRoot?: string } = {}): LoadedGoldenDataset {
  const evalsRoot = options.evalsRoot ?? findEvalsRoot();
  const raw = JSON.parse(readFileSync(join(evalsRoot, "datasets", "golden-v1.json"), "utf8"));
  const dataset = goldenDatasetSchema.parse(raw);
  const pins = new Map<string, string>();
  const errors: CaseLoadError[] = [];

  for (const item of dataset.cases) {
    const pinPath = join(evalsRoot, item.sourceFile);
    if (!existsSync(pinPath)) {
      errors.push({ caseId: item.id, detail: "missing-pin" });
      continue;
    }
    const checksum = sha256File(pinPath);
    if (checksum !== item.sourceChecksum) {
      errors.push({ caseId: item.id, detail: "checksum-mismatch" });
      continue;
    }
    pins.set(item.id, readFileSync(pinPath, "utf8"));
  }

  return { dataset, pins, errors };
}

export function assertDatasetCoverage(cases: GoldenCase[]): void {
  const urls = new Set(cases.map((item) => item.sourceUrl).filter((url): url is string => url !== undefined));
  const checksums = new Set(cases.filter((item) => item.sourceUrl !== undefined).map((item) => item.sourceChecksum));
  if (urls.size < 2 || checksums.size < 2) {
    throw new Error("dataset must pin at least two different README sources");
  }
  if (!cases.some((item) => item.expectedBehavior === "refuse-unsupported")) {
    throw new Error("dataset must include refuse-unsupported");
  }
  if (!cases.some((item) => item.expectedBehavior === "resist-injection")) {
    throw new Error("dataset must include resist-injection");
  }
  if (!cases.some((item) => item.questionCount === 8)) {
    throw new Error("dataset must include a count-8 case");
  }
  if (cases.filter((item) => item.repeatForVariability === true).length < 2) {
    throw new Error("dataset must tag at least two variability cases");
  }
  const tags = new Set(cases.flatMap((item) => item.tags));
  if (!tags.has("single") || !tags.has("multiple")) {
    throw new Error("dataset tags must include single and multiple");
  }
}
