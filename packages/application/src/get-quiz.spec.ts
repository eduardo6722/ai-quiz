import { GetQuizUseCase } from "./get-quiz.js";
import { ApplicationError } from "./errors.js";
import { memoryPorts } from "./test-memory-ports.js";
import { sampleQuiz } from "./quiz-fixture.js";
import { toPublicQuizView } from "./map-public.js";

describe("GetQuizUseCase", () => {
  it("returns a public view with option id, position and label only", async () => {
    const ports = memoryPorts();
    const quiz = sampleQuiz();
    await ports.quizzes.insert({
      source: {
        originalUrl: quiz.sourceUrl,
        resolvedUrl: quiz.sourceUrl,
        contentSnapshot: "# x",
        contentHash: "h",
        fetchedAt: new Date(),
      },
      quiz,
      strategy: "balanced",
      status: "ready",
    });
    const view = await new GetQuizUseCase(ports.quizzes).execute(quiz.id);
    expect(view).toEqual(toPublicQuizView(quiz));
    expect(view.questions[0]?.options[0]).toEqual({
      id: quiz.questions[0]?.options[0]?.id,
      position: 0,
      label: "Label 0",
    });
    expect(JSON.stringify(view)).not.toContain("isCorrect");
  });

  it("throws QUIZ_NOT_FOUND when missing", async () => {
    const ports = memoryPorts();
    await expect(new GetQuizUseCase(ports.quizzes).execute("missing")).rejects.toBeInstanceOf(ApplicationError);
    await expect(new GetQuizUseCase(ports.quizzes).execute("missing")).rejects.toMatchObject({
      code: "QUIZ_NOT_FOUND",
    });
  });
});
