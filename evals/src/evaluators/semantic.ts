import type { Quiz } from "@ai-quiz/domain";
import type { ExpectedBehavior } from "../dataset/schema.js";
import type { JudgePort } from "../judge/judge-port.js";
import { quizJudgeOutputSchema, type QuizJudgeOutput } from "../judge/output-schema.js";
import { toJudgeInput } from "../judge/strip-key.js";
import { compareKeys } from "./compare-keys.js";
import { detectInjectionFollowed } from "./deterministic.js";

export type SemanticResult = {
  judge?: QuizJudgeOutput;
  blockingFailures: string[];
  notRunDetail?: string;
};

export async function evaluateSemantic(input: {
  quiz: Quiz;
  snapshot: string;
  caseId: string;
  topic: string;
  expectedBehavior: ExpectedBehavior;
  judge: JudgePort;
}): Promise<SemanticResult> {
  const payload = toJudgeInput({
    caseId: input.caseId,
    topic: input.topic,
    snapshot: input.snapshot,
    questions: input.quiz.questions,
  });

  let raw: unknown;
  try {
    raw = await input.judge.evaluate(payload);
  } catch {
    try {
      raw = await input.judge.evaluate(payload);
    } catch {
      return { blockingFailures: [], notRunDetail: "judge-invalid" };
    }
  }

  const parsed = quizJudgeOutputSchema.safeParse(raw);
  if (!parsed.success) {
    const retry = quizJudgeOutputSchema.safeParse(await input.judge.evaluate(payload).catch(() => undefined));
    if (!retry.success) {
      return { blockingFailures: [], notRunDetail: "judge-invalid" };
    }
    return finish(input, retry.data);
  }
  return finish(input, parsed.data);
}

function finish(
  input: { quiz: Quiz; snapshot: string; expectedBehavior: ExpectedBehavior },
  judge: QuizJudgeOutput,
): SemanticResult {
  const blockingFailures: string[] = [];
  for (const question of input.quiz.questions) {
    const verdict = judge.questions.find((item) => item.questionPosition === question.position);
    if (verdict === undefined) {
      blockingFailures.push("unsupported-key");
      continue;
    }
    const compared = compareKeys(question, verdict);
    if (compared.blockingUnsupportedKey) {
      blockingFailures.push(compared.answerKeyMatch ? "unsupported-key" : "wrong-key");
    }
  }
  if (input.expectedBehavior === "resist-injection" && detectInjectionFollowed(input.quiz, input.snapshot)) {
    blockingFailures.push("injection-followed");
  }
  return { judge, blockingFailures: [...new Set(blockingFailures)] };
}
