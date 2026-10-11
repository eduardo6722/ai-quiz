import { AlreadyScoredConflictError } from "@ai-quiz/application";
import { Prisma } from "../../../../../generated/prisma/client";
import type {
  AttemptRecord,
  AttemptRepositoryPort,
  CreateOpenAttemptInput,
  FinalizeAttemptInput,
} from "@ai-quiz/domain";
import { quizInclude, type DbClient } from "./db-client";
import { toDomainQuiz, toScoredResult } from "./quiz-mapper";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

const attemptInclude = {
  answers: {
    include: {
      selections: true,
      question: { include: { options: true } },
    },
  },
  quiz: { include: quizInclude },
} as const;

export class AttemptPrismaRepository implements AttemptRepositoryPort {
  constructor(private readonly db: DbClient) {}

  async createOpen(input: CreateOpenAttemptInput): Promise<AttemptRecord> {
    const created = await this.db.quizAttempt.create({
      data: {
        id: input.id,
        quizId: input.quizId,
        publicTokenHash: input.publicTokenHash,
        status: "open",
      },
    });
    return {
      id: created.id,
      quizId: created.quizId,
      publicTokenHash: created.publicTokenHash,
      status: "open",
      startedAt: created.startedAt,
    };
  }

  async findById(id: string): Promise<AttemptRecord | undefined> {
    await this.lockAttempt(id);
    const row = await this.db.quizAttempt.findUnique({
      where: { id },
      include: attemptInclude,
    });
    if (row === null) {
      return undefined;
    }
    return this.toRecord(row);
  }

  async finalizeIfOpen(input: FinalizeAttemptInput): Promise<"finalized" | "already_scored"> {
    await this.lockAttempt(input.attemptId);
    const current = await this.db.quizAttempt.findUnique({ where: { id: input.attemptId } });
    if (current === null) {
      return "already_scored";
    }
    if (current.status === "scored") {
      return "already_scored";
    }

    try {
      for (const question of input.result.questions) {
        const answer = await this.db.attemptAnswer.create({
          data: {
            attemptId: input.attemptId,
            questionId: question.questionId,
            rawScore: question.rawScore,
          },
        });
        if (question.selectedOptionIds.length > 0) {
          await this.db.attemptAnswerSelection.createMany({
            data: question.selectedOptionIds.map((optionId) => ({
              answerId: answer.id,
              optionId,
            })),
          });
        }
      }

      const updated = await this.db.quizAttempt.updateMany({
        where: { id: input.attemptId, status: "open" },
        data: {
          status: "scored",
          submittedAt: new Date(),
          weightedScore: input.result.weightedScore,
          weightedScoreDisplay: input.result.weightedScoreDisplay,
          percentageDisplay: input.result.percentageDisplay,
        },
      });
      return updated.count === 1 ? "finalized" : "already_scored";
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AlreadyScoredConflictError();
      }
      throw error;
    }
  }

  private async lockAttempt(id: string): Promise<void> {
    await this.db.$queryRaw(Prisma.sql`SELECT id FROM "QuizAttempt" WHERE id = ${id} FOR UPDATE`);
  }

  private toRecord(row: {
    id: string;
    quizId: string;
    publicTokenHash: string;
    status: "open" | "scored";
    startedAt: Date;
    submittedAt: Date | null;
    weightedScore: number | null;
    weightedScoreDisplay: number | null;
    percentageDisplay: number | null;
    answers: {
      questionId: string;
      rawScore: number;
      selections: { optionId: string }[];
      question: {
        id: string;
        position: number;
        type: "single" | "multiple";
        prompt: string;
        options: { id: string; position: number; label: string; isCorrect: boolean }[];
      };
    }[];
    quiz: Parameters<typeof toDomainQuiz>[0];
  }): AttemptRecord {
    const quiz = toDomainQuiz(row.quiz);
    const result =
      row.status === "scored" &&
      row.weightedScore !== null &&
      row.weightedScoreDisplay !== null &&
      row.percentageDisplay !== null
        ? toScoredResult({
            quiz,
            weightedScore: row.weightedScore,
            weightedScoreDisplay: row.weightedScoreDisplay,
            percentageDisplay: row.percentageDisplay,
            answers: row.answers,
          })
        : undefined;
    return {
      id: row.id,
      quizId: row.quizId,
      publicTokenHash: row.publicTokenHash,
      status: row.status,
      startedAt: row.startedAt,
      submittedAt: row.submittedAt ?? undefined,
      result,
    };
  }
}
