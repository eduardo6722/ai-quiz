import { publicQuizViewSchema } from "@ai-quiz/contracts";
import { createQuiz, getQuiz, getResult, startAttempt, submitAttempt } from "./api-client";
import { makePublicQuiz, makePublicResult } from "./test-fixtures";

describe("api-client", () => {
  const quiz = makePublicQuiz();

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("posts create-quiz with omit credentials and no bearer", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "quiz-1", status: "ready" }),
    });
    await createQuiz({
      topic: "Hexagonal architecture",
      sourceUrl: "https://example.com/README.md",
      questionCount: 5,
    });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/v1/quizzes",
      expect.objectContaining({
        method: "POST",
        credentials: "omit",
        body: expect.stringContaining("Hexagonal architecture"),
      }),
    );
    const init = (fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBeNull();
  });

  it("sends a Bearer token only on submit and result", async () => {
    const result = makePublicResult(quiz);
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => result });
    await submitAttempt("attempt-1", "secret-token", {
      answers: quiz.questions.map((question) => ({
        questionId: question.id,
        selectedOptionIds: [question.options[0]?.id ?? ""],
      })),
    });
    await getResult("attempt-1", "secret-token");
    const auths = (fetch as jest.Mock).mock.calls.map((call) =>
      new Headers((call[1] as RequestInit | undefined)?.headers).get("authorization"),
    );
    expect(auths).toEqual(["Bearer secret-token", "Bearer secret-token"]);
  });

  it("rejects a quiz payload that includes isCorrect", async () => {
    const leaky = {
      ...quiz,
      questions: quiz.questions.map((question) => ({
        ...question,
        options: question.options.map((option) => ({ ...option, isCorrect: false })),
      })),
    };
    expect(() => publicQuizViewSchema.parse(leaky)).toThrow();
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => leaky });
    await expect(getQuiz("quiz-1")).rejects.toThrow();
  });

  it("parses start-attempt without treating it as a quiz view", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ attemptId: "attempt-1", token: "a".repeat(32) }),
    });
    const started = await startAttempt("quiz-1");
    expect(started).toEqual({ attemptId: "attempt-1", token: "a".repeat(32) });
    expect(started).not.toHaveProperty("questions");
  });
});
