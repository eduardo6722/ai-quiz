import { randomUUID } from "node:crypto";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import {
  createQuizResponseSchema,
  publicQuizViewSchema,
  publicResultSchema,
  startAttemptResponseSchema,
} from "@ai-quiz/contracts";
import type { Question, QuizGenerationPort } from "@ai-quiz/domain";
import { bearer, CREATE_BODY, createApiApp } from "../support/create-app";
import { FIXTURE_EXCERPT } from "../../../src/quiz/fixture/fixture-bank";

function leadingKeySingles(count: number): Question[] {
  return Array.from({ length: count }, (_, index) => ({
    id: randomUUID(),
    position: index,
    prompt: `Leading key prompt ${index}`,
    type: "single" as const,
    sourceExcerpt: FIXTURE_EXCERPT,
    options: [0, 1, 2, 3].map((position) => ({
      id: randomUUID(),
      position,
      label: `Q${index} option ${position}`,
      isCorrect: position === 0,
    })),
  }));
}

function alwaysFirstAnswers(quiz: { questions: { id: string; options: { id: string; position: number }[] }[] }) {
  return quiz.questions.map((question) => ({
    questionId: question.id,
    selectedOptionIds: [
      question.options.find((option) => option.position === 0)?.id ?? question.options[0]!.id,
    ],
  }));
}

function trueKeyByLabel(quiz: {
  questions: { id: string; position: number; options: { id: string; label: string }[] }[];
}) {
  return quiz.questions.map((question) => ({
    questionId: question.id,
    selectedOptionIds: question.options
      .filter((option) => option.label === `Q${question.position} option 0`)
      .map((option) => option.id),
  }));
}

describe("quiz option order", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const generation: QuizGenerationPort = {
      generate: async ({ count }) => ({ questions: leadingKeySingles(count) }),
    };
    app = await createApiApp({ generation });
  });

  afterAll(async () => {
    await app.close();
  });

  it("mixes leading-key options so always-first is not a perfect sitting", async () => {
    const server = app.getHttpServer();
    const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    expect(created.status).toBe(201);
    const createBody = createQuizResponseSchema.parse(created.body);
    expect(JSON.stringify(created.body)).not.toContain("sk-");

    const got = await request(server).get(`/v1/quizzes/${createBody.id}`);
    expect(got.status).toBe(200);
    const quiz = publicQuizViewSchema.parse(got.body);
    expect(JSON.stringify(got.body)).not.toContain("isCorrect");

    const again = await request(server).get(`/v1/quizzes/${createBody.id}`);
    expect(publicQuizViewSchema.parse(again.body).questions.map((question) =>
      question.options.map((option) => ({ id: option.id, label: option.label, position: option.position })),
    )).toEqual(
      quiz.questions.map((question) =>
        question.options.map((option) => ({ id: option.id, label: option.label, position: option.position })),
      ),
    );

    const started = await request(server).post(`/v1/quizzes/${createBody.id}/attempts`);
    expect(started.status).toBe(201);
    const startBody = startAttemptResponseSchema.parse(started.body);

    const alwaysFirst = await request(server)
      .post(`/v1/attempts/${startBody.attemptId}/submit`)
      .set(bearer(startBody.token))
      .send({ answers: alwaysFirstAnswers(quiz) });
    expect(alwaysFirst.status).toBe(200);
    const alwaysFirstResult = publicResultSchema.parse(alwaysFirst.body);
    expect(alwaysFirstResult.weightedScore).toBeLessThan(4);
    expect(JSON.stringify(alwaysFirst.body)).not.toContain("sk-");
  });

  it("still awards full credit when the true labels are selected after mix", async () => {
    const server = app.getHttpServer();
    const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    expect(created.status).toBe(201);
    const quiz = publicQuizViewSchema.parse(
      (await request(server).get(`/v1/quizzes/${created.body.id}`)).body,
    );
    expect(JSON.stringify(quiz)).not.toContain("isCorrect");

    const started = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
    const startBody = startAttemptResponseSchema.parse(started.body);
    const submitted = await request(server)
      .post(`/v1/attempts/${startBody.attemptId}/submit`)
      .set(bearer(startBody.token))
      .send({ answers: trueKeyByLabel(quiz) });
    expect(submitted.status).toBe(200);
    const result = publicResultSchema.parse(submitted.body);
    expect(result.weightedScore).toBe(4);
    expect(
      result.questions.map((question) =>
        question.options.map((option) => ({ id: option.id, label: option.label, position: option.position })),
      ),
    ).toEqual(
      quiz.questions.map((question) =>
        question.options.map((option) => ({ id: option.id, label: option.label, position: option.position })),
      ),
    );
  });
});
