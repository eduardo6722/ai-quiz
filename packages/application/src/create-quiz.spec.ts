import { DomainError, type MarkdownSourcePort, type QuizGenerationPort } from "@ai-quiz/domain";
import { CreateQuizUseCase } from "./create-quiz.js";
import { memoryPorts } from "./test-memory-ports.js";
import { sampleQuiz } from "./quiz-fixture.js";

const snapshot = {
  originalUrl: "https://example.com/README.md",
  resolvedUrl: "https://example.com/README.md",
  contentSnapshot: "# Fixture",
  contentHash: "abc",
  fetchedAt: new Date("2026-10-10T00:00:00Z"),
};

describe("CreateQuizUseCase", () => {
  it("persists a ready quiz of the requested length", async () => {
    const ports = memoryPorts();
    const quiz = sampleQuiz();
    const source: MarkdownSourcePort = { fetch: jest.fn(async () => snapshot) };
    const generation: QuizGenerationPort = {
      generate: jest.fn(async ({ count }) => quiz.questions.slice(0, count)),
    };
    const useCase = new CreateQuizUseCase(source, generation, ports.uow);
    const result = await useCase.execute({
      topic: "Hexagonal architecture",
      sourceUrl: snapshot.originalUrl,
      questionCount: 5,
      strategy: "balanced",
    });
    expect(result.status).toBe("ready");
    expect(ports.store.quizzes.get(result.id)?.quiz.questions).toHaveLength(5);
    expect(ports.store.sources).toHaveLength(1);
  });

  it("aborts when validateQuiz fails so nothing playable is stored", async () => {
    const ports = memoryPorts();
    const source: MarkdownSourcePort = { fetch: jest.fn(async () => snapshot) };
    const generation: QuizGenerationPort = {
      generate: jest.fn(async () => sampleQuiz().questions.slice(0, 2)),
    };
    const insert = jest.spyOn(ports.quizzes, "insert");
    const useCase = new CreateQuizUseCase(source, generation, ports.uow);
    await expect(
      useCase.execute({
        topic: "Hexagonal architecture",
        sourceUrl: snapshot.originalUrl,
        questionCount: 5,
        strategy: "balanced",
      }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(insert).not.toHaveBeenCalled();
    expect(ports.store.quizzes.size).toBe(0);
  });

  it("aborts when the snapshot is empty so insert is not applied", async () => {
    const ports = memoryPorts();
    const source: MarkdownSourcePort = {
      fetch: jest.fn(async () => ({ ...snapshot, contentSnapshot: "   " })),
    };
    const generation: QuizGenerationPort = { generate: jest.fn() };
    const useCase = new CreateQuizUseCase(source, generation, ports.uow);
    await expect(
      useCase.execute({
        topic: "Hexagonal architecture",
        sourceUrl: snapshot.originalUrl,
        questionCount: 5,
        strategy: "balanced",
      }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(generation.generate).not.toHaveBeenCalled();
    expect(ports.store.quizzes.size).toBe(0);
  });
});
