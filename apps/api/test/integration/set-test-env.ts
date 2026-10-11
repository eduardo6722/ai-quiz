import { existsSync } from "node:fs";

process.env.NODE_ENV = "test";

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

process.env.DATABASE_URL =
  process.env.DATABASE_URL?.includes("ai_quiz_test") === true
    ? process.env.DATABASE_URL
    : `postgresql://postgres:postgres@${postgresHost()}:5432/ai_quiz_test?schema=public`;
