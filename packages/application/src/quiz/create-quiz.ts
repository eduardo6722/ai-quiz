import { randomUUID } from 'node:crypto';
import {
  isDomainError,
  mixQuizOptionOrder,
  validateQuiz,
  type MarkdownSourcePort,
  type QuizGenerationPort,
  type TelemetryPort,
  type UnitOfWorkPort,
} from '@ai-quiz/domain';
import type { CreateQuizRequest, CreateQuizResponse } from '@ai-quiz/contracts';
import { ApplicationError, isApplicationError } from '../errors.js';
import { assertGrounded } from './grounding.js';
import { assertSourceSufficient } from './source-sufficiency.js';

const MAX_SNAPSHOT_BYTES = 512 * 1024;
const GENERATION_WINDOW_CHARS = 32_000;
const MAX_GENERATION_ATTEMPTS = 3;

const noopTelemetry: TelemetryPort = {
  runStage: async (_input, fn) => fn(),
  recordEvent: () => undefined,
};

export class CreateQuizUseCase {
  constructor(
    private readonly source: MarkdownSourcePort,
    private readonly generation: QuizGenerationPort,
    private readonly uow: UnitOfWorkPort,
    private readonly telemetry: TelemetryPort = noopTelemetry,
  ) {}

  async execute(request: CreateQuizRequest): Promise<CreateQuizResponse> {
    return this.telemetry.runStage(
      { name: 'create-quiz', attributes: { strategy: request.strategy } },
      async () => {
        const snapshot = await this.telemetry.runStage({ name: 'fetch' }, () =>
          this.source.fetch(request.sourceUrl),
        );

        const sourceText = await this.telemetry.runStage(
          {
            name: 'preprocessing',
            attributes: {
              topicChars: request.topic.length,
              sourceChars: snapshot.contentSnapshot.length,
              sourceHash: snapshot.contentHash,
            },
          },
          async () => {
            if (Buffer.byteLength(snapshot.contentSnapshot, 'utf8') > MAX_SNAPSHOT_BYTES) {
              throw new ApplicationError('SOURCE_TOO_LARGE', 'source snapshot exceeds 512 KiB');
            }
            assertSourceSufficient(snapshot.contentSnapshot, request.questionCount);
            return snapshot.contentSnapshot.slice(0, GENERATION_WINDOW_CHARS);
          },
        );

        let lastInvalid: ApplicationError | undefined;

        for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
          try {
            const generated = await this.telemetry.runStage(
              {
                name: 'generation',
                attributes: { attempt, strategy: request.strategy },
              },
              async () => {
                const generatedQuiz = await this.generation.generate({
                  topic: request.topic,
                  sourceText,
                  count: request.questionCount,
                  strategy: request.strategy,
                });
                const candidate = {
                  id: randomUUID(),
                  topic: request.topic,
                  sourceUrl: snapshot.originalUrl,
                  questions: generatedQuiz.questions,
                };
                assertGrounded(generatedQuiz.questions, snapshot.contentSnapshot);
                validateQuiz(candidate);
                return generatedQuiz;
              },
            );
            const quiz = {
              id: randomUUID(),
              topic: request.topic,
              sourceUrl: snapshot.originalUrl,
              questions: generated.questions,
            };
            await this.telemetry.runStage({ name: 'validation' }, async () => {
              assertGrounded(generated.questions, snapshot.contentSnapshot);
              validateQuiz(quiz);
            });
            const mixed = mixQuizOptionOrder(quiz);
            validateQuiz(mixed);
            const record = await this.uow.transaction((repos) =>
              repos.quizzes.insert({
                source: snapshot,
                quiz: mixed,
                strategy: request.strategy,
                status: 'ready',
                modelId: generated.modelId,
              }),
            );
            this.telemetry.recordEvent({
              name: 'quiz-ready',
              attributes: { quizId: record.quiz.id },
            });
            return { id: record.quiz.id, status: 'ready' };
          } catch (error) {
            if (isApplicationError(error) && error.code === 'GENERATION_UPSTREAM_FAILED') {
              if (
                isImmediateUpstreamFailure(error.message) ||
                attempt === MAX_GENERATION_ATTEMPTS
              ) {
                throw error;
              }
              lastInvalid = error;
              continue;
            }
            if (isApplicationError(error) && error.code === 'GENERATION_INVALID') {
              lastInvalid = error;
              continue;
            }
            if (isDomainError(error) && error.code === 'QUIZ_INVALID') {
              lastInvalid = new ApplicationError('GENERATION_INVALID', error.message);
              continue;
            }
            throw error;
          }
        }

        if (lastInvalid?.code === 'GENERATION_UPSTREAM_FAILED') {
          throw lastInvalid;
        }
        throw new ApplicationError('GENERATION_RETRIES_EXHAUSTED', 'generation retries exhausted');
      },
    );
  }
}

function isImmediateUpstreamFailure(message: string): boolean {
  return /not configured|quota exceeded|rejected credentials/i.test(message);
}
