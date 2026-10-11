import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { publicQuizViewSchema } from "@ai-quiz/contracts";
import { testPrisma } from "../integration/postgres.setup";
import { bearer, CREATE_BODY, createApiApp } from "./create-app";
import { answersWithWrongFirstSingle, correctAnswersFromPublicQuiz } from "./fixture-answers";

describe("answer ownership", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rejects duplicate question ids and foreign options without scoring", async () => {
    const server = app.getHttpServer();
    const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    const quiz = publicQuizViewSchema.parse(
      (await request(server).get(`/v1/quizzes/${created.body.id}`)).body,
    );
    const started = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
    const answers = correctAnswersFromPublicQuiz(quiz);
    const duplicate = await request(server)
      .post(`/v1/attempts/${started.body.attemptId}/submit`)
      .set(bearer(started.body.token))
      .send({ answers: [...answers, answers[0]] });
    expect(duplicate.status).toBe(400);
    expect(duplicate.body).toMatchObject({ code: "SUBMIT_ANSWERS_INVALID" });

    const foreign = [...answers];
    foreign[0] = { questionId: quiz.questions[0]!.id, selectedOptionIds: ["00000000-0000-4000-8000-000000000099"] };
    const illegal = await request(server)
      .post(`/v1/attempts/${started.body.attemptId}/submit`)
      .set(bearer(started.body.token))
      .send({ answers: foreign });
    expect(illegal.status).toBe(400);
    expect(illegal.body).toMatchObject({ code: "SELECTION_ILLEGAL" });

    const attempt = await testPrisma().quizAttempt.findUnique({ where: { id: started.body.attemptId } });
    expect(attempt?.status).toBe("open");
    expect(attempt?.weightedScore).toBeNull();

    const wrong = await request(server)
      .post(`/v1/attempts/${started.body.attemptId}/submit`)
      .set(bearer(started.body.token))
      .send({ answers: answersWithWrongFirstSingle(quiz) });
    expect(wrong.status).toBe(200);
    expect(wrong.body.questions[0].rawScore).toBe(0);
  });
});
