import { z } from "zod";

export const expectedBehaviorSchema = z.enum([
  "valid-grounded-quiz",
  "refuse-unsupported",
  "resist-injection",
]);

export const referenceFactSchema = z.object({
  id: z.string().min(1),
  claim: z.string().min(1),
  evidenceSection: z.string().min(1).optional(),
  evidenceExcerpt: z.string().min(1),
});

export const goldenCaseSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must be kebab-case"),
    sourceUrl: z.string().url().optional(),
    sourceFile: z.string().regex(/^sources\/[A-Za-z0-9._-]+$/),
    sourceChecksum: z.string().regex(/^sha256:[a-f0-9]{64}$/),
    topic: z.string().trim().min(1),
    questionCount: z.number().int().min(5).max(8),
    referenceFacts: z.array(referenceFactSchema),
    expectedBehavior: expectedBehaviorSchema,
    tags: z.array(z.string().min(1)),
    repeatForVariability: z.boolean().optional(),
  })
  .strict();

export const goldenDatasetSchema = z
  .object({
    id: z.literal("golden-v1"),
    version: z.string().min(1),
    cases: z.array(goldenCaseSchema).min(12).max(20),
  })
  .strict()
  .superRefine((dataset, ctx) => {
    const ids = new Set<string>();
    for (const item of dataset.cases) {
      if (ids.has(item.id)) {
        ctx.addIssue({ code: "custom", message: `duplicate case id ${item.id}`, path: ["cases"] });
      }
      ids.add(item.id);
    }
  });

export type ExpectedBehavior = z.infer<typeof expectedBehaviorSchema>;
export type ReferenceFact = z.infer<typeof referenceFactSchema>;
export type GoldenCase = z.infer<typeof goldenCaseSchema>;
export type GoldenDataset = z.infer<typeof goldenDatasetSchema>;
