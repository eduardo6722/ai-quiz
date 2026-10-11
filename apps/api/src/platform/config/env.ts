import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const apiEnvSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required" })
    .min(1, "DATABASE_URL is required")
    .url("DATABASE_URL must be a valid URL"),
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DIRECT_URL: z.string().url().optional().or(z.literal("")),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_BASE_URL: z.string().optional(),
  PROMPT_VERSION: z.string().optional(),
  EVAL_JUDGE_MODEL: z.string().optional(),
  WEB_ORIGIN: z.string().url("WEB_ORIGIN must be a valid absolute URL").default("http://localhost:3000"),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function loadDotenvFiles(): void {
  for (const candidate of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
    if (existsSync(candidate)) {
      config({ path: candidate, quiet: true });
      return;
    }
  }
}

function formatEnvError(error: z.ZodError): string {
  const issue = error.issues[0];
  const key = issue?.path[0]?.toString() ?? "configuration";
  return `Invalid configuration: ${key} — ${issue?.message ?? "failed validation"}`;
}

export function parseApiEnv(input: Record<string, string | undefined>): ApiEnv {
  const result = apiEnvSchema.safeParse({
    DATABASE_URL: input.DATABASE_URL,
    PORT: input.PORT,
    NODE_ENV: input.NODE_ENV,
    DIRECT_URL: input.DIRECT_URL,
    OPENAI_API_KEY: input.OPENAI_API_KEY,
    OPENAI_MODEL: input.OPENAI_MODEL,
    LANGFUSE_PUBLIC_KEY: input.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_SECRET_KEY: input.LANGFUSE_SECRET_KEY,
    LANGFUSE_BASE_URL: input.LANGFUSE_BASE_URL,
    PROMPT_VERSION: input.PROMPT_VERSION,
    EVAL_JUDGE_MODEL: input.EVAL_JUDGE_MODEL,
    WEB_ORIGIN: input.WEB_ORIGIN === "" ? undefined : input.WEB_ORIGIN,
  });

  if (!result.success) {
    throw new Error(formatEnvError(result.error));
  }

  return result.data;
}

export function loadApiEnv(): ApiEnv {
  loadDotenvFiles();
  return parseApiEnv(process.env);
}
