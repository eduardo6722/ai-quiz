import { z } from "zod";

export const createQuizResponseSchema = z
  .object({
    id: z.string().min(1),
    status: z.enum(["ready", "failed"]),
  })
  .strict();

export type CreateQuizResponse = z.infer<typeof createQuizResponseSchema>;
