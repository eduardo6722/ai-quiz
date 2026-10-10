import { ErrorCodes, parseCreateQuizRequest, publicQuizViewSchema } from "./index.js";

describe("contracts public API", () => {
  it("exports create-quiz parsing and a key-free quiz view schema", () => {
    expect(ErrorCodes.CREATE_QUIZ_INVALID).toBe("CREATE_QUIZ_INVALID");
    expect(
      parseCreateQuizRequest({
        topic: "Topic",
        sourceUrl: "https://example.com/a.md",
      }).questionCount,
    ).toBe(5);
    expect(publicQuizViewSchema.safeParse({ id: "x" }).success).toBe(false);
  });
});
