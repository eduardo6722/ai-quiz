import type { Quiz } from "@ai-quiz/domain";

export function sampleQuiz(id = "quiz-1"): Quiz {
  return {
    id,
    topic: "Hexagonal architecture",
    sourceUrl: "https://example.com/README.md",
    questions: [0, 1, 2, 3, 4].map((index) => ({
      id: `${id}-q${index}`,
      position: index,
      prompt: `Prompt ${index}`,
      type: index === 1 ? ("multiple" as const) : ("single" as const),
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
