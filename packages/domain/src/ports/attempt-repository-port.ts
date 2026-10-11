import type { ScoredResult } from "../attempt.js";

export type AttemptStatus = "open" | "scored";

export type AttemptRecord = {
  id: string;
  quizId: string;
  publicTokenHash: string;
  status: AttemptStatus;
  startedAt: Date;
  submittedAt?: Date;
  result?: ScoredResult;
};

export type CreateOpenAttemptInput = {
  id: string;
  quizId: string;
  publicTokenHash: string;
};

export type FinalizeAttemptInput = {
  attemptId: string;
  quizId: string;
  result: ScoredResult;
};

export type AttemptRepositoryPort = {
  createOpen(input: CreateOpenAttemptInput): Promise<AttemptRecord>;
  findById(id: string): Promise<AttemptRecord | undefined>;
  finalizeIfOpen(input: FinalizeAttemptInput): Promise<"finalized" | "already_scored">;
};
