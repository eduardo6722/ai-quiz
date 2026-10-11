import type { Question } from "@ai-quiz/domain";
import { ApplicationError } from "../errors.js";

const LINK = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)/y;

type MappedText = {
  text: string;
  tokenStart: number[];
  tokenEnd: number[];
};

function unwrapMarkdownLinks(input: string): MappedText {
  const chars: string[] = [];
  const tokenStart: number[] = [];
  const tokenEnd: number[] = [];
  let index = 0;
  while (index < input.length) {
    LINK.lastIndex = index;
    const match = LINK.exec(input);
    if (match !== null && match.index === index) {
      const label = match[1] ?? match[3] ?? "";
      const end = index + match[0].length;
      for (const char of label) {
        chars.push(char);
        tokenStart.push(index);
        tokenEnd.push(end);
      }
      index = end;
      continue;
    }
    chars.push(input[index]!);
    tokenStart.push(index);
    tokenEnd.push(index + 1);
    index += 1;
  }
  return { text: chars.join(""), tokenStart, tokenEnd };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findCollapsedWhitespace(haystack: string, excerpt: string): string | undefined {
  const parts = excerpt.trim().split(/\s+/).filter((part) => part.length > 0);
  if (parts.length === 0) {
    return undefined;
  }
  return haystack.match(new RegExp(parts.map(escapeRegExp).join("\\s+")))?.[0];
}

function sliceFromMapped(
  snapshot: string,
  mapped: MappedText,
  start: number,
  end: number,
): string | undefined {
  if (start < 0 || start >= end || end > mapped.tokenStart.length) {
    return undefined;
  }
  const from = mapped.tokenStart[start];
  const to = mapped.tokenEnd[end - 1];
  if (from === undefined || to === undefined) {
    return undefined;
  }
  return snapshot.slice(from, to);
}

function findInMapped(snapshot: string, mapped: MappedText, excerpt: string): string | undefined {
  const exactAt = mapped.text.indexOf(excerpt);
  if (exactAt >= 0) {
    return sliceFromMapped(snapshot, mapped, exactAt, exactAt + excerpt.length);
  }
  const collapsed = findCollapsedWhitespace(mapped.text, excerpt);
  if (collapsed === undefined) {
    return undefined;
  }
  const at = mapped.text.indexOf(collapsed);
  if (at < 0) {
    return undefined;
  }
  return sliceFromMapped(snapshot, mapped, at, at + collapsed.length);
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return trimmed;
  }
  const pairs: Array<[string, string]> = [
    ['"', '"'],
    ["'", "'"],
    ["“", "”"],
  ];
  for (const [open, close] of pairs) {
    if (trimmed.startsWith(open) && trimmed.endsWith(close)) {
      return trimmed.slice(1, -1).trim();
    }
  }
  return trimmed;
}

export function locateSourceExcerpt(snapshotText: string, excerpt: string): string | undefined {
  const candidates = [excerpt, stripWrappingQuotes(excerpt)]
    .map((value) => value.trim())
    .filter((value, index, all) => value.length > 0 && all.indexOf(value) === index);

  for (const candidate of candidates) {
    if (snapshotText.includes(candidate)) {
      return candidate;
    }
    const whitespace = findCollapsedWhitespace(snapshotText, candidate);
    if (whitespace !== undefined) {
      return whitespace;
    }
    const mapped = unwrapMarkdownLinks(snapshotText);
    const viaLinks = findInMapped(snapshotText, mapped, candidate);
    if (viaLinks !== undefined) {
      return viaLinks;
    }
    const unwrappedCandidate = unwrapMarkdownLinks(candidate).text;
    if (unwrappedCandidate !== candidate) {
      const viaUnwrappedExcerpt = findInMapped(snapshotText, mapped, unwrappedCandidate);
      if (viaUnwrappedExcerpt !== undefined) {
        return viaUnwrappedExcerpt;
      }
    }
  }
  return undefined;
}

export function assertGrounded(questions: Question[], snapshotText: string): void {
  for (const question of questions) {
    const located = locateSourceExcerpt(snapshotText, question.sourceExcerpt ?? "");
    if (located === undefined) {
      throw new ApplicationError(
        "GENERATION_INVALID",
        "each question must include a source excerpt from the snapshot",
      );
    }
    question.sourceExcerpt = located;
  }
}
