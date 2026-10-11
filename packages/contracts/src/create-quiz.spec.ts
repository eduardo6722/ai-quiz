import { ContractError } from "./error-codes.js";
import { parseCreateQuizRequest } from "./create-quiz.js";

function expectCode(run: () => void, code: string): void {
  expect(run).toThrow(ContractError);
  try {
    run();
  } catch (error) {
    expect(error).toMatchObject({ code });
  }
}

describe("parseCreateQuizRequest", () => {
  it("accepts a non-empty topic, https URL, and count 5–8", () => {
    expect(
      parseCreateQuizRequest({
        topic: "Hexagonal architecture",
        sourceUrl: "https://example.com/README.md",
        questionCount: 6,
      }),
    ).toEqual({
      topic: "Hexagonal architecture",
      sourceUrl: "https://example.com/README.md",
      questionCount: 6,
      strategy: "balanced",
    });
  });

  it("defaults questionCount to 5 when omitted", () => {
    const parsed = parseCreateQuizRequest({
      topic: "Ports",
      sourceUrl: "https://example.com/doc.md?raw=1",
    });
    expect(parsed.questionCount).toBe(5);
  });

  it("trims topic", () => {
    const parsed = parseCreateQuizRequest({
      topic: "  Adapters  ",
      sourceUrl: "https://example.com/a.md",
    });
    expect(parsed.topic).toBe("Adapters");
  });

  it("rejects blank topic, http URLs, and counts outside 5–8", () => {
    expectCode(
      () => parseCreateQuizRequest({ topic: "   ", sourceUrl: "https://example.com/a.md" }),
      "CREATE_QUIZ_INVALID",
    );
    expectCode(
      () =>
        parseCreateQuizRequest({
          topic: "Topic",
          sourceUrl: "http://example.com/a.md",
        }),
      "CREATE_QUIZ_INVALID",
    );
    expectCode(
      () =>
        parseCreateQuizRequest({
          topic: "Topic",
          sourceUrl: "https://example.com/a.md",
          questionCount: 4,
        }),
      "CREATE_QUIZ_INVALID",
    );
    expectCode(
      () =>
        parseCreateQuizRequest({
          topic: "Topic",
          sourceUrl: "https://example.com/a.md",
          questionCount: 9,
        }),
      "CREATE_QUIZ_INVALID",
    );
  });

  it("defaults strategy to balanced and rejects unknown strategies", () => {
    expect(
      parseCreateQuizRequest({
        topic: "Topic",
        sourceUrl: "https://example.com/a.md",
      }).strategy,
    ).toBe("balanced");
    expectCode(
      () =>
        parseCreateQuizRequest({
          topic: "Topic",
          sourceUrl: "https://example.com/a.md",
          strategy: "comprehension",
        }),
      "CREATE_QUIZ_INVALID",
    );
  });
});
