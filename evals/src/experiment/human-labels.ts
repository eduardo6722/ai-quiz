import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { findEvalsRoot } from "../dataset/paths.js";

export const humanLabelSchema = z.object({
  caseId: z.string().min(1),
  questionPosition: z.number().int().min(0).optional(),
  runId: z.string().min(1),
  acceptableRelevance: z.boolean(),
  acceptableClarity: z.boolean(),
  blockingKeyFailure: z.boolean(),
  disagreesWithJudge: z.boolean(),
  notes: z.string(),
});

export const humanLabelsFileSchema = z.object({
  version: z.string().min(1),
  labels: z.array(humanLabelSchema),
});

export type HumanLabel = z.infer<typeof humanLabelSchema>;

export function loadHumanLabels(options: { evalsRoot?: string } = {}): HumanLabel[] {
  const root = options.evalsRoot ?? findEvalsRoot();
  const path = join(root, "baselines", "human-labels.v1.json");
  if (!existsSync(path)) {
    return [];
  }
  const parsed = humanLabelsFileSchema.parse(JSON.parse(readFileSync(path, "utf8")));
  return parsed.labels;
}
