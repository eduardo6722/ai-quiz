import { z } from "zod";
import { ContractError, ErrorCodes } from "../errors/error-codes.js";

const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionIds: z
    .array(z.string().min(1))
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, "selectedOptionIds must be unique"),
});

export const submitAnswersRequestSchema = z.object({
  answers: z
    .array(answerSchema)
    .min(5)
    .max(8)
    .refine(
      (answers) => new Set(answers.map((item) => item.questionId)).size === answers.length,
      "questionId values must be unique",
    ),
});

export type SubmitAnswersRequest = z.infer<typeof submitAnswersRequestSchema>;

export function parseSubmitAnswersRequest(input: unknown): SubmitAnswersRequest {
  const result = submitAnswersRequestSchema.safeParse(input);
  if (!result.success) {
    throw new ContractError(
      ErrorCodes.SUBMIT_ANSWERS_INVALID,
      result.error.issues[0]?.message ?? "Invalid submit-answers request",
    );
  }
  return result.data;
}
