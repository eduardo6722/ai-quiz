import { fixtureQuiz } from "../testing/quiz-fixture.js";
import { toJudgeInput } from "./strip-key.js";

describe("toJudgeInput", () => {
  it("omits isCorrect and answer-key indices", () => {
    const quiz = fixtureQuiz({ excerpt: "Ports are interfaces the core depends on" });
    const payload = toJudgeInput({
      caseId: "c1",
      topic: quiz.topic,
      snapshot: "Ports are interfaces the core depends on",
      questions: quiz.questions,
    });
    const json = JSON.stringify(payload);
    expect(json).not.toContain("isCorrect");
    expect(payload.questions[0]?.options[0]).toEqual({ position: 0, label: "Label 0" });
  });
});
