import { timingSafeEqual } from "node:crypto";

export function tokenHashesMatch(stored: string, provided: string): boolean {
  const left = Buffer.from(stored, "utf8");
  const right = Buffer.from(provided, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
