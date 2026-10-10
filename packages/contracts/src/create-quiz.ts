import { z } from "zod";
import { ContractError, ErrorCodes } from "./error-codes.js";

export const createQuizRequestSchema = z.object({
  topic: z.string().trim().min(1).max(200),
  sourceUrl: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), "sourceUrl must be an https URL with a host"),
  questionCount: z.number().int().min(5).max(8).optional().default(5),
});

export type CreateQuizRequest = z.infer<typeof createQuizRequestSchema>;

export function parseCreateQuizRequest(input: unknown): CreateQuizRequest {
  const result = createQuizRequestSchema.safeParse(input);
  if (!result.success) {
    throw new ContractError(
      ErrorCodes.CREATE_QUIZ_INVALID,
      result.error.issues[0]?.message ?? "Invalid create-quiz request",
    );
  }
  return result.data;
}
