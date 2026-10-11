import type { Quiz } from "@ai-quiz/domain";
import { publicQuizViewSchema } from "@ai-quiz/contracts";
import { toPublicQuizView } from "./to-public-quiz.js";

function quiz(): Quiz {
  return {
    id: "quiz-1",
    topic: "Hexagonal architecture",
    sourceUrl: "https://example.com/README.md",
    questions: [0, 1, 2, 3, 4].map((index) => ({
      id: `q${index}`,
      position: index,
      prompt: `Prompt ${index}`,
      type: "single" as const,
      options: [0, 1, 2, 3].map((position) => ({
        id: `q${index}-${position}`,
        position,
        label: `Label ${position}`,
        isCorrect: position === 0,
      })),
    })),
  };
}

describe("toPublicQuizView", () => {
  it("omits correctness flags, excerpts, and model fields", () => {
    const model = quiz();
    model.questions = model.questions.map((question) => ({
      ...question,
      sourceExcerpt: "Ports are interfaces the core depends on",
    }));
    const view = toPublicQuizView(model);
    expect(JSON.stringify(view)).not.toContain("isCorrect");
    expect(JSON.stringify(view)).not.toContain("sourceExcerpt");
    expect(JSON.stringify(view)).not.toContain("modelId");
    expect(view.questions[0]?.options[0]).toEqual({
      id: model.questions[0]?.options[0]?.id,
      position: 0,
      label: "Label 0",
    });
    expect(publicQuizViewSchema.parse(view).questions).toHaveLength(5);
  });
});
