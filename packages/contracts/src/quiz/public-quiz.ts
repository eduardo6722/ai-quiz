import { z } from "zod";

const publicOptionSchema = z
  .object({
    id: z.string().min(1),
    position: z.number().int().min(0).max(3),
    label: z.string().min(1),
  })
  .strict();

const publicQuestionSchema = z
  .object({
    id: z.string().min(1),
    position: z.number().int().min(0),
    prompt: z.string().min(1),
    type: z.enum(["single", "multiple"]),
    options: z.array(publicOptionSchema).length(4),
  })
  .strict();

export const publicQuizViewSchema = z
  .object({
    id: z.string().min(1),
    topic: z.string().min(1),
    sourceUrl: z.string().min(1),
    questions: z.array(publicQuestionSchema).min(5).max(8),
  })
  .strict();

export type PublicQuizView = z.infer<typeof publicQuizViewSchema>;
