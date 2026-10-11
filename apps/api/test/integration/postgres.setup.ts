import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const TEST_DB = "ai_quiz_test";

function postgresHost(): string {
  const existing = process.env.DATABASE_URL ?? "";
  if (existing.includes("@db:")) {
    return "db";
  }
  if (existing.includes("@localhost:") || existing.includes("@127.0.0.1:")) {
    return "localhost";
  }
  return existsSync("/.dockerenv") ? "db" : "localhost";
}

const host = postgresHost();
const ADMIN_URL = `postgresql://postgres:postgres@${host}:5432/postgres`;

export const testDatabaseUrl =
  process.env.DATABASE_URL?.includes(TEST_DB) === true
    ? process.env.DATABASE_URL
    : `postgresql://postgres:postgres@${host}:5432/${TEST_DB}?schema=public`;

let prisma: PrismaClient | undefined;

export function testPrisma(): PrismaClient {
  if (prisma === undefined) {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: testDatabaseUrl }),
    });
  }
  return prisma;
}

async function ensureDatabase(): Promise<void> {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  const found = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [TEST_DB]);
  if (found.rowCount === 0) {
    await admin.query(`CREATE DATABASE ${TEST_DB}`);
  }
  await admin.end();
}

function migrate(): void {
  const apiDir = resolve(__dirname, "../..");
  const env = { ...process.env, DATABASE_URL: testDatabaseUrl };
  try {
    execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
      cwd: apiDir,
      env,
      stdio: "pipe",
    });
    return;
  } catch {
    execFileSync(
      "docker",
      [
        "exec",
        "-e",
        `DATABASE_URL=postgresql://postgres:postgres@db:5432/${TEST_DB}?schema=public`,
        "ai-quiz-api",
        "sh",
        "-c",
        "cd /app/apps/api && ./node_modules/.bin/prisma migrate deploy",
      ],
      { stdio: "pipe" },
    );
  }
}

beforeAll(async () => {
  await ensureDatabase();
  migrate();
  await testPrisma().$connect();
});

beforeEach(async () => {
  await testPrisma().$executeRawUnsafe(
    'TRUNCATE "AttemptAnswerSelection", "AttemptAnswer", "QuizAttempt", "QuestionOption", "Question", "Quiz", "SourceDocument" CASCADE',
  );
});

afterAll(async () => {
  await prisma?.$disconnect();
});
