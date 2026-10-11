import { createHash } from "node:crypto";
import { ApplicationError } from "@ai-quiz/application";

export const MIN_USABLE_CHARS = 200;

export function decodeUtf8(body: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new ApplicationError("SOURCE_UNUSABLE", "source is not valid UTF-8");
  }
}

export function normalizeMarkdown(raw: Buffer | string): { text: string; title?: string } {
  const text = typeof raw === "string" ? raw : decodeUtf8(raw);
  if (text.includes("\u0000")) {
    throw new ApplicationError("SOURCE_UNUSABLE", "source contains binary data");
  }
  const stripped = text.replace(/<!--[\s\S]*?-->/g, "").trim();
  const heading = stripped.match(/^#\s+(.+)$/m);
  const title = heading?.[1]?.trim();
  return title === undefined || title.length === 0 ? { text: stripped } : { text: stripped, title };
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}
