import { z } from "zod";

const resultOptionSchema = z
  .object({
    id: z.string().min(1),
    position: z.number().int().min(0).max(3),
    label: z.string().min(1),
    isCorrect: z.boolean(),
  })
  .strict();

const resultQuestionSchema = z
  .object({
    id: z.string().min(1),
    position: z.number().int().min(0),
    type: z.enum(["single", "multiple"]),
    rawScore: z.number().int().min(0).max(4),
    selectedOptionIds: z.array(z.string().min(1)),
    options: z.array(resultOptionSchema).length(4),
  })
  .strict();

export const publicResultSchema = z
  .object({
    attemptId: z.string().min(1),
    quizId: z.string().min(1),
    weightedScore: z.number(),
    weightedScoreDisplay: z.number(),
    percentageDisplay: z.number(),
    questions: z.array(resultQuestionSchema).min(5).max(8),
  })
  .strict();

export type PublicResult = z.infer<typeof publicResultSchema>;
