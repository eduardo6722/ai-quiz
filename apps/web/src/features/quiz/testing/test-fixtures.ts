import { publicQuizViewSchema, publicResultSchema, type PublicQuizView, type PublicResult } from "@ai-quiz/contracts";

export function makePublicQuiz(count = 5): PublicQuizView {
  const questions = Array.from({ length: count }, (_, index) => ({
    id: `q${index}`,
    position: index,
    prompt: `Prompt ${index + 1}?`,
    type: (index === 1 ? "multiple" : "single") as "single" | "multiple",
    options: [
      { id: `q${index}-a`, position: 0, label: `Choice A${index}` },
      { id: `q${index}-b`, position: 1, label: `Choice B${index}` },
      { id: `q${index}-c`, position: 2, label: `Choice C${index}` },
      { id: `q${index}-d`, position: 3, label: `Choice D${index}` },
    ],
  }));
  return publicQuizViewSchema.parse({
    id: "quiz-1",
    topic: "Hexagonal architecture",
    sourceUrl: "https://example.com/README.md",
    questions,
  });
}

export function makePublicResult(quiz: PublicQuizView): PublicResult {
  return publicResultSchema.parse({
    attemptId: "attempt-1",
    quizId: quiz.id,
    weightedScore: 1.873,
    weightedScoreDisplay: 1.87,
    percentageDisplay: 46.83,
    questions: quiz.questions.map((question, index) => ({
      id: question.id,
      position: question.position,
      type: question.type,
      rawScore: index === 0 ? 4 : 0,
      selectedOptionIds: [question.options[0]?.id ?? ""],
      options: question.options.map((option, optionIndex) => ({
        ...option,
        isCorrect: index === 0 ? optionIndex === 0 : optionIndex === 1,
      })),
    })),
  });
}
