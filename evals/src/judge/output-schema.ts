import { z } from "zod";

const scale = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

export const optionSupportSchema = z.object({
  position: z.number().int().min(0).max(3),
  supportedBySource: z.boolean(),
  evidenceExcerpt: z.string(),
  uncertain: z.boolean(),
});

export const questionJudgeOutputSchema = z.object({
  questionPosition: z.number().int().min(0),
  proposedCorrectPositions: z.array(z.number().int().min(0).max(3)),
  optionSupport: z.array(optionSupportSchema).length(4),
  relevance: scale,
  clarity: scale,
  ambiguity: scale,
  distractorQuality: scale,
  coverageContribution: scale,
  uncertainty: z.enum(["low", "medium", "high"]),
  notes: z.string(),
});

export const quizJudgeOutputSchema = z.object({
  questions: z.array(questionJudgeOutputSchema),
  setCoverage: scale,
  notes: z.string(),
});

export type OptionSupport = z.infer<typeof optionSupportSchema>;
export type QuestionJudgeOutput = z.infer<typeof questionJudgeOutputSchema>;
export type QuizJudgeOutput = z.infer<typeof quizJudgeOutputSchema>;
