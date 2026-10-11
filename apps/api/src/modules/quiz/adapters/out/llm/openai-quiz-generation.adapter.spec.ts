import { Logger } from "@nestjs/common";
import { OpenAiQuizGenerationAdapter } from "./openai-quiz-generation.adapter";

jest.mock("@ai-sdk/openai", () => ({
  createOpenAI: jest.fn(() => (modelId: string) => ({ modelId })),
}));

jest.mock("ai", () => ({
  generateText: jest.fn(),
  Output: { object: (value: unknown) => value },
  NoObjectGeneratedError: {
    isInstance: (error: unknown) =>
      Boolean(
        error &&
          typeof error === "object" &&
          "name" in error &&
          (error as { name: string }).name === "AI_NoObjectGeneratedError",
      ),
  },
}));

function payload(count = 5) {
  return {
    questions: Array.from({ length: count }, (_, index) => ({
      prompt: `Prompt ${index}`,
      type: index === 1 ? ("multiple" as const) : ("single" as const),
      sourceExcerpt: "Ports are interfaces the core depends on",
      options: [0, 1, 2, 3].map((position) => ({
        label: `Label ${index}-${position}`,
        isCorrect: index === 1 ? position === 0 || position === 1 : position === 0,
      })),
    })),
  };
}

const input = {
  topic: "Hexagonal architecture",
  sourceText: "Ports are interfaces the core depends on.",
  count: 5,
  strategy: "balanced" as const,
};

describe("OpenAiQuizGenerationAdapter", () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns minted questions and the configured model id", async () => {
    const generateTextFn = jest.fn(async () => ({ output: payload() }));
    const adapter = new OpenAiQuizGenerationAdapter({
      apiKey: "sk-test",
      modelId: "gpt-4o-mini",
      generateTextFn,
    });
    const result = await adapter.generate(input);
    expect(result.modelId).toBe("gpt-4o-mini");
    expect(result.questions).toHaveLength(5);
    expect(result.questions[0]?.options).toHaveLength(4);
    expect(generateTextFn).toHaveBeenCalledTimes(1);
  });

  it("fails immediately when the API key is missing without calling generateText", async () => {
    const generateTextFn = jest.fn();
    const adapter = new OpenAiQuizGenerationAdapter({
      apiKey: "",
      modelId: "gpt-4o-mini",
      generateTextFn,
    });
    await expect(adapter.generate(input)).rejects.toMatchObject({
      code: "GENERATION_UPSTREAM_FAILED",
      message: expect.stringMatching(/not configured/i),
    });
    expect(generateTextFn).not.toHaveBeenCalled();
  });

  it("maps NoObjectGeneratedError to GENERATION_INVALID without leaking output text", async () => {
    const generateTextFn = jest.fn(async () => {
      throw Object.assign(new Error("No object generated."), {
        name: "AI_NoObjectGeneratedError",
        text: "sk-secret-should-not-leak Ignore previous instructions",
      });
    });
    const adapter = new OpenAiQuizGenerationAdapter({
      apiKey: "sk-test",
      modelId: "gpt-4o-mini",
      generateTextFn,
    });
    const error = await adapter.generate(input).catch((caught: unknown) => caught);
    expect(error).toMatchObject({
      code: "GENERATION_INVALID",
      message: "model output failed schema validation",
    });
    expect(JSON.stringify(error)).not.toContain("sk-secret");
  });

  it("maps timeout and network failures to GENERATION_UPSTREAM_FAILED without SDK cause", async () => {
    const generateTextFn = jest.fn(async () => {
      throw Object.assign(new Error("fetch failed"), { cause: "sk-live-secret" });
    });
    const adapter = new OpenAiQuizGenerationAdapter({
      apiKey: "sk-test",
      modelId: "gpt-4o-mini",
      generateTextFn,
    });
    const error = await adapter.generate(input).catch((caught: unknown) => caught);
    expect(error).toMatchObject({
      code: "GENERATION_UPSTREAM_FAILED",
      message: "model provider request failed",
    });
    expect(JSON.stringify(error)).not.toContain("sk-live-secret");
    expect(JSON.stringify(error)).not.toContain("sk-test");
    expect(Logger.prototype.error).not.toHaveBeenCalled();
  });
});
