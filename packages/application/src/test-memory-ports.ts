import type {
  AttemptRecord,
  AttemptRepositoryPort,
  InsertQuizInput,
  QuizRecord,
  QuizRepositoryPort,
  SourceSnapshot,
  UnitOfWorkPort,
} from "@ai-quiz/domain";

export function memoryPorts() {
  const quizzes = new Map<string, QuizRecord>();
  const sources: SourceSnapshot[] = [];
  const attempts = new Map<string, AttemptRecord>();

  const quizRepo: QuizRepositoryPort = {
    async insert(input: InsertQuizInput) {
      sources.push(input.source);
      const record: QuizRecord = {
        quiz: input.quiz,
        status: input.status,
        sourceDocumentId: "source-1",
        strategy: input.strategy,
      };
      quizzes.set(input.quiz.id, record);
      return record;
    },
    async findById(id: string) {
      return quizzes.get(id);
    },
  };

  const attemptRepo: AttemptRepositoryPort = {
    async createOpen(input) {
      const record: AttemptRecord = {
        id: input.id,
        quizId: input.quizId,
        publicTokenHash: input.publicTokenHash,
        status: "open",
        startedAt: new Date(),
      };
      attempts.set(input.id, record);
      return record;
    },
    async findById(id: string) {
      return attempts.get(id);
    },
    async finalizeIfOpen(input) {
      const current = attempts.get(input.attemptId);
      if (current === undefined || current.status === "scored") {
        return "already_scored";
      }
      attempts.set(input.attemptId, {
        ...current,
        status: "scored",
        submittedAt: new Date(),
        result: input.result,
      });
      return "finalized";
    },
  };

  const uow: UnitOfWorkPort = {
    transaction: (fn) => fn({ quizzes: quizRepo, attempts: attemptRepo }),
  };

  return { quizzes: quizRepo, attempts: attemptRepo, uow, store: { quizzes, attempts, sources } };
}
