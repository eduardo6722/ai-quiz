import type { QuizRepositoryPort } from "@ai-quiz/domain";
import { toPublicQuizView } from "../mapping/map-public.js";
import { ApplicationError } from "../errors.js";
import type { PublicQuizView } from "@ai-quiz/contracts";

export class GetQuizUseCase {
  constructor(private readonly quizzes: QuizRepositoryPort) {}

  async execute(quizId: string): Promise<PublicQuizView> {
    const record = await this.quizzes.findById(quizId);
    if (record === undefined) {
      throw new ApplicationError("QUIZ_NOT_FOUND", "Quiz not found");
    }
    if (record.status !== "ready") {
      throw new ApplicationError("QUIZ_NOT_PLAYABLE", "Quiz is not playable");
    }
    return toPublicQuizView(record.quiz);
  }
}
