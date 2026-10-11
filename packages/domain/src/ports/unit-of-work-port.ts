import type { AttemptRepositoryPort } from "./attempt-repository-port.js";
import type { QuizRepositoryPort } from "./quiz-repository-port.js";

export type UnitOfWorkRepos = {
  quizzes: QuizRepositoryPort;
  attempts: AttemptRepositoryPort;
};

export type UnitOfWorkPort = {
  transaction<T>(fn: (repos: UnitOfWorkRepos) => Promise<T>): Promise<T>;
};
