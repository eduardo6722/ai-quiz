import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ApplicationError } from "@ai-quiz/application";

export function mintAttemptToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAttemptToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function tokenHashEquals(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function parseBearerToken(header: string | undefined): string {
  if (header === undefined || header.trim().length === 0) {
    throw new ApplicationError("UNAUTHORIZED_ATTEMPT", "Missing attempt token");
  }
  const [scheme, token, ...rest] = header.split(" ");
  if (scheme !== "Bearer" || !token || rest.length > 0) {
    throw new ApplicationError("UNAUTHORIZED_ATTEMPT", "Malformed attempt token");
  }
  return token;
}
