import type { AttemptRepositoryPort } from "../attempt/attempt-repository-port.js";
import type { QuizRepositoryPort } from "../quiz/quiz-repository-port.js";

export type UnitOfWorkRepos = {
  quizzes: QuizRepositoryPort;
  attempts: AttemptRepositoryPort;
};

export type UnitOfWorkPort = {
  transaction<T>(fn: (repos: UnitOfWorkRepos) => Promise<T>): Promise<T>;
};
