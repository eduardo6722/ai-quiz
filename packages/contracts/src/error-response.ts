import { z } from "zod";

export const errorResponseSchema = z
  .object({
    code: z.string().min(1),
    message: z.string().min(1),
  })
  .strict();

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
