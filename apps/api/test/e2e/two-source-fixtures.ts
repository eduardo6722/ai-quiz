import { randomUUID } from "node:crypto";
import type { Question, QuizGenerationPort } from "@ai-quiz/domain";
import type { FetchTransport } from "../../src/modules/quiz/adapters/out/source-fetch/fetch-transport";

export const EXPRESS_URL = "https://example.com/express/README.md";
export const NEST_URL = "https://example.com/nestjs/README.md";

export const EXPRESS_EXCERPT = "Express routing maps HTTP methods to handler functions.";
export const NEST_EXCERPT = "NestJS modules group controllers and providers together.";

export const EXPRESS_MARKDOWN = `# Express

${EXPRESS_EXCERPT}
A router binds a path to a callback. Middleware runs before the handler.
This fixture snapshot is long enough to pass the usable-length policy for tests.
`.repeat(2);

export const NEST_MARKDOWN = `# NestJS

${NEST_EXCERPT}
Providers are injectable classes. Controllers handle inbound HTTP.
This fixture snapshot is long enough to pass the usable-length policy for tests.
`.repeat(2);

function fourOptions(prefix: string, correctPosition = 0): Question["options"] {
  return [0, 1, 2, 3].map((position) => ({
    id: randomUUID(),
    position,
    label: `${prefix} option ${position}`,
    isCorrect: position === correctPosition,
  }));
}

export function questionsForSource(kind: "express" | "nest", count: number): Question[] {
  const word = kind === "express" ? "Express" : "NestJS";
  const excerpt = kind === "express" ? EXPRESS_EXCERPT : NEST_EXCERPT;
  return Array.from({ length: count }, (_, position) => ({
    id: randomUUID(),
    position,
    prompt: `What does the ${word} README say in question ${position + 1}?`,
    type: "single" as const,
    sourceExcerpt: excerpt,
    options: fourOptions(`${word}-${position}`),
  }));
}

export const sourceAwareGeneration: QuizGenerationPort = {
  async generate(input) {
    const kind = input.sourceText.includes(EXPRESS_EXCERPT)
      ? "express"
      : input.sourceText.includes(NEST_EXCERPT)
        ? "nest"
        : undefined;
    if (kind === undefined) {
      throw new Error("unexpected source text for two-source generation double");
    }
    return { questions: questionsForSource(kind, input.count), modelId: "mock-two-source" };
  },
};

export function markdownTransport(): FetchTransport {
  return {
    lookup: async () => [{ address: "8.8.8.8", family: 4 }],
    get: async (options) => {
      const markdown = options.path.includes("nestjs") ? NEST_MARKDOWN : EXPRESS_MARKDOWN;
      return {
        status: 200,
        headers: { "content-type": "text/markdown; charset=utf-8" },
        body: Buffer.from(markdown, "utf8"),
      };
    },
  };
}

export function expectedWeightedScore(scores: number[]): number {
  let weightedSum = 0;
  let weightSum = 0;
  for (let index = 0; index < scores.length; index += 1) {
    const weight = 1.1 ** index;
    weightedSum += scores[index]! * weight;
    weightSum += weight;
  }
  return weightedSum / weightSum;
}
