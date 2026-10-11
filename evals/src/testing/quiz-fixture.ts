import type { Quiz } from "@ai-quiz/domain";

export function fixtureQuiz(input: {
  id?: string;
  count?: number;
  excerpt: string;
  topic?: string;
  allCorrect?: boolean;
  duplicatePrompts?: boolean;
}): Quiz {
  const count = input.count ?? 5;
  const id = input.id ?? "fixture";
  return {
    id,
    topic: input.topic ?? "Test topic",
    sourceUrl: "https://example.com/README.md",
    questions: Array.from({ length: count }, (_, index) => ({
      id: `${id}-q${index}`,
      position: index,
      prompt: input.duplicatePrompts ? "Same prompt" : `Prompt ${index}`,
      type: index === 1 ? ("multiple" as const) : ("single" as const),
      sourceExcerpt: input.excerpt,
      options: [0, 1, 2, 3].map((position) => ({
        id: `${id}-q${index}-${position}`,
        position,
        label: `Label ${position}`,
        isCorrect: input.allCorrect ? true : index === 1 ? position === 0 || position === 1 : position === 0,
      })),
    })),
  };
}
