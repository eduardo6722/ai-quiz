import type { GenerateQuizInput, GeneratedQuiz, QuizGenerationPort } from "@ai-quiz/domain";
import { fixtureQuiz } from "./quiz-fixture.js";

export class FixedQuizGenerationAdapter implements QuizGenerationPort {
  constructor(private readonly allCorrect = false) {}

  async generate(input: GenerateQuizInput): Promise<GeneratedQuiz> {
    const excerpt = input.sourceText.trim().slice(0, 80) || "placeholder excerpt";
    return {
      modelId: "mocked",
      questions: fixtureQuiz({
        id: "mocked",
        count: input.count,
        excerpt,
        topic: input.topic,
        allCorrect: this.allCorrect,
      }).questions,
    };
  }
}
