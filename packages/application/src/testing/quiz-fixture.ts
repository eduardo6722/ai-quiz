import type { Quiz } from "@ai-quiz/domain";

export const SAMPLE_EXCERPT = "Ports are interfaces the core depends on";

export const SAMPLE_SNAPSHOT = `${SAMPLE_EXCERPT}. Adapters implement those ports.
A quiz has 5 to 8 questions. Scoring is deterministic and never decided by a model.
The application core stays free of HTTP clients, databases, and provider SDKs.
This snapshot is long enough to pass the usable-length policy for tests.
`;

export function sampleQuiz(id = "quiz-1", questionCount = 5): Quiz {
  return {
    id,
    topic: "Hexagonal architecture",
    sourceUrl: "https://example.com/README.md",
    questions: Array.from({ length: questionCount }, (_, index) => ({
      id: `${id}-q${index}`,
      position: index,
      prompt: `Prompt ${index}`,
      type: index === 1 ? ("multiple" as const) : ("single" as const),
      sourceExcerpt: SAMPLE_EXCERPT,
      options: [0, 1, 2, 3].map((position) => ({
        id: `${id}-q${index}-${position}`,
        position,
        label: `Label ${position}`,
        isCorrect: index === 1 ? position === 0 || position === 1 : position === 0,
      })),
    })),
  };
}

export function correctAnswers(quiz: Quiz) {
  return quiz.questions.map((question) => ({
    questionId: question.id,
    selectedOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id),
  }));
}
