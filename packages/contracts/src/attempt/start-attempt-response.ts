import { z } from "zod";

export const startAttemptResponseSchema = z
  .object({
    attemptId: z.string().min(1),
    token: z.string().min(32),
  })
  .strict();

export type StartAttemptResponse = z.infer<typeof startAttemptResponseSchema>;
