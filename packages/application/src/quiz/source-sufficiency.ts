import { ApplicationError } from '../errors.js';

const HEADING = /^#{1,6}\s/;
const LIST_ITEM = /^\s*[-*]\s+(.*)$/;
const MIN_CLAIM_WORDS = 4;
const MIN_CLAIM_CHARS = 24;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function extractRawUnits(text: string): string[] {
  const withoutComments = text.replace(/<!--[\s\S]*?-->/g, '');
  const units: string[] = [];
  let paragraph = '';

  const flushParagraph = (): void => {
    if (paragraph.trim().length > 0) {
      units.push(...splitSentences(paragraph));
    }
    paragraph = '';
  };

  for (const line of withoutComments.split('\n')) {
    const trimmedStart = line.trimStart();
    if (HEADING.test(trimmedStart)) {
      flushParagraph();
      continue;
    }
    const list = line.match(LIST_ITEM);
    if (list?.[1] !== undefined) {
      flushParagraph();
      units.push(list[1]);
      continue;
    }
    if (line.trim().length === 0) {
      flushParagraph();
      continue;
    }
    paragraph = paragraph.length === 0 ? line.trim() : `${paragraph} ${line.trim()}`;
  }
  flushParagraph();
  return units;
}

function normalizeKey(unit: string): string {
  return unit.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

function isKeepable(key: string): boolean {
  const words = key.split(' ').filter((word) => word.length > 0);
  return words.length >= MIN_CLAIM_WORDS && key.length >= MIN_CLAIM_CHARS;
}

export function countUniqueClaims(text: string): number {
  const keys = new Set<string>();
  for (const unit of extractRawUnits(text)) {
    const key = normalizeKey(unit);
    if (isKeepable(key)) {
      keys.add(key);
    }
  }
  return keys.size;
}

export function assertSourceSufficient(text: string, questionCount: number): void {
  if (countUniqueClaims(text) < questionCount) {
    throw new ApplicationError('SOURCE_UNUSABLE', 'source does not have enough information');
  }
}
