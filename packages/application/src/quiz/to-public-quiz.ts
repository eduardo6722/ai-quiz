import type { Quiz } from "@ai-quiz/domain";
import type { PublicQuizView } from "@ai-quiz/contracts";

export function toPublicQuizView(quiz: Quiz): PublicQuizView {
  return {
    id: quiz.id,
    topic: quiz.topic,
    sourceUrl: quiz.sourceUrl,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      position: question.position,
      prompt: question.prompt,
      type: question.type,
      options: question.options.map((option) => ({
        id: option.id,
        position: option.position,
        label: option.label,
      })),
    })),
  };
}
