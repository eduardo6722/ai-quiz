import { randomUUID } from "node:crypto";
import type { InsertQuizInput, QuizRecord, QuizRepositoryPort } from "@ai-quiz/domain";
import { quizInclude, type DbClient } from "./db-client";
import { toQuizRecord } from "./quiz-mapper";

export class QuizPrismaRepository implements QuizRepositoryPort {
  constructor(private readonly db: DbClient) {}

  async insert(input: InsertQuizInput): Promise<QuizRecord> {
    const sourceId = randomUUID();
    const created = await this.db.quiz.create({
      data: {
        id: input.quiz.id,
        topic: input.quiz.topic,
        strategy: input.strategy,
        status: input.status,
        modelId: null,
        sourceDocument: {
          create: {
            id: sourceId,
            originalUrl: input.source.originalUrl,
            resolvedUrl: input.source.resolvedUrl,
            contentHash: input.source.contentHash,
            title: input.source.title,
            fetchedAt: input.source.fetchedAt,
            contentSnapshot: input.source.contentSnapshot,
          },
        },
        questions: {
          create: input.quiz.questions.map((question) => ({
            id: question.id,
            position: question.position,
            type: question.type,
            prompt: question.prompt,
            options: {
              create: question.options.map((option) => ({
                id: option.id,
                position: option.position,
                label: option.label.trim(),
                isCorrect: option.isCorrect,
              })),
            },
          })),
        },
      },
      include: quizInclude,
    });
    return toQuizRecord(created);
  }

  async findById(id: string): Promise<QuizRecord | undefined> {
    const row = await this.db.quiz.findUnique({
      where: { id },
      include: quizInclude,
    });
    return row === null ? undefined : toQuizRecord(row);
  }
}
