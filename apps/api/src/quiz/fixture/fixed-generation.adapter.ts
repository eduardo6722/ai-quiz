import { validateQuiz, type QuizGenerationPort, type GenerateQuizInput, type Question } from "@ai-quiz/domain";
import { buildFixtureQuestions } from "./fixture-bank";

export class FixedGenerationAdapter implements QuizGenerationPort {
  async generate(input: GenerateQuizInput): Promise<{ questions: Question[] }> {
    const questions = buildFixtureQuestions(input.count);
    validateQuiz({
      id: "fixture",
      topic: input.topic,
      sourceUrl: "https://example.com/fixture.md",
      questions,
    });
    return { questions };
  }
}
