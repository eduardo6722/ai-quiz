import { createQuizResponseSchema } from "./create-quiz-response.js";

describe("createQuizResponseSchema", () => {
  it("accepts id and ready status", () => {
    expect(createQuizResponseSchema.parse({ id: "quiz-1", status: "ready" })).toEqual({
      id: "quiz-1",
      status: "ready",
    });
  });

  it("rejects questions and isCorrect", () => {
    expect(() =>
      createQuizResponseSchema.parse({
        id: "quiz-1",
        status: "ready",
        questions: [],
      }),
    ).toThrow();
    expect(() =>
      createQuizResponseSchema.parse({
        id: "quiz-1",
        status: "ready",
        isCorrect: true,
      }),
    ).toThrow();
  });
});
