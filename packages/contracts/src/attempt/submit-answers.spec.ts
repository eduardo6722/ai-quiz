import { ContractError } from "../errors/error-codes.js";
import { parseSubmitAnswersRequest } from "./submit-answers.js";

function fiveAnswers() {
  return [0, 1, 2, 3, 4].map((index) => ({
    questionId: `q${index}`,
    selectedOptionIds: [`opt-${index}`],
  }));
}

function expectCode(run: () => void, code: string): void {
  expect(run).toThrow(ContractError);
  try {
    run();
  } catch (error) {
    expect(error).toMatchObject({ code });
  }
}

describe("parseSubmitAnswersRequest", () => {
  it("accepts 5–8 answers with unique question ids", () => {
    expect(parseSubmitAnswersRequest({ answers: fiveAnswers() }).answers).toHaveLength(5);
  });

  it("rejects duplicate option ids in one answer", () => {
    const answers = fiveAnswers();
    answers[0] = { questionId: "q0", selectedOptionIds: ["a", "a"] };
    expectCode(() => parseSubmitAnswersRequest({ answers }), "SUBMIT_ANSWERS_INVALID");
  });

  it("rejects empty ids and missing answers", () => {
    expectCode(() => parseSubmitAnswersRequest({ answers: [] }), "SUBMIT_ANSWERS_INVALID");
    const answers = fiveAnswers();
    answers[0] = { questionId: "", selectedOptionIds: ["a"] };
    expectCode(() => parseSubmitAnswersRequest({ answers }), "SUBMIT_ANSWERS_INVALID");
  });
});
