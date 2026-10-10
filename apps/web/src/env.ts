import { z } from "zod";

const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string({ error: "NEXT_PUBLIC_API_URL is required" })
    .url("NEXT_PUBLIC_API_URL must be a valid absolute URL"),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

function formatEnvError(error: z.ZodError): string {
  const issue = error.issues[0];
  const key = issue?.path[0]?.toString() ?? "configuration";
  return `Invalid configuration: ${key} — ${issue?.message ?? "failed validation"}`;
}

export function parseWebEnv(input: Record<string, string | undefined>): WebEnv {
  const result = webEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: input.NEXT_PUBLIC_API_URL,
  });

  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }

  return result.data;
}

export const env = parseWebEnv({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
