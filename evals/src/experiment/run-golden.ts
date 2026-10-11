import { randomUUID } from "node:crypto";
import type { GeneratedQuiz, Quiz, QuizGenerationPort } from "@ai-quiz/domain";
import { loadGoldenDataset } from "../dataset/load-dataset.js";
import { evaluateDeterministic } from "../evaluators/deterministic.js";
import { evaluateSemantic } from "../evaluators/semantic.js";
import { evaluateScoringInvariant } from "../evaluators/scoring-invariant.js";
import type { JudgePort } from "../judge/judge-port.js";
import { findEvalsRoot } from "../dataset/paths.js";
import type { ExperimentRecorderPort } from "./experiment-recorder-port.js";
import type { CaseResult, ExperimentRun } from "./types.js";

export type RunGoldenInput = {
  generation: QuizGenerationPort;
  judge?: JudgePort;
  recorder: ExperimentRecorderPort;
  evalsRoot?: string;
  mode: "live" | "mocked";
  skipJudge?: boolean;
  repeat?: boolean;
  modelId?: string;
  promptVersion?: string;
  liveAvailable?: boolean;
};

function toQuiz(generated: GeneratedQuiz, topic: string): Quiz {
  return {
    id: `eval-${randomUUID()}`,
    topic,
    sourceUrl: "https://example.com/eval",
    questions: generated.questions,
  };
}

export async function runGolden(input: RunGoldenInput): Promise<ExperimentRun> {
  const evalsRoot = input.evalsRoot ?? findEvalsRoot();
  const loaded = loadGoldenDataset({ evalsRoot });
  const startedAt = new Date().toISOString();
  const caseResults: CaseResult[] = [];
  const scoring = evaluateScoringInvariant();

  for (const item of loaded.dataset.cases) {
    const loadError = loaded.errors.find((error) => error.caseId === item.id);
    const repeats = input.repeat && item.repeatForVariability ? 2 : 1;
    for (let repeatIndex = 1; repeatIndex <= repeats; repeatIndex += 1) {
      if (loadError) {
        const skipped: CaseResult = {
          caseId: item.id,
          repeatIndex,
          mode: input.mode,
          sourceChecksum: item.sourceChecksum,
          expectedBehavior: item.expectedBehavior,
          deterministic: [],
          blockingFailures: [],
          outcome: "not_run",
          notRunDetail: loadError.detail,
        };
        caseResults.push(skipped);
        await input.recorder.recordItem(skipped);
        continue;
      }
      if (input.mode === "live" && input.liveAvailable === false) {
        const skipped: CaseResult = {
          caseId: item.id,
          repeatIndex,
          mode: "live",
          sourceChecksum: item.sourceChecksum,
          expectedBehavior: item.expectedBehavior,
          deterministic: [],
          blockingFailures: [],
          outcome: "not_run",
          notRunDetail: "missing-openai-key",
        };
        caseResults.push(skipped);
        await input.recorder.recordItem(skipped);
        continue;
      }

      const snapshot = loaded.pins.get(item.id) ?? "";
      const started = Date.now();
      let generated: GeneratedQuiz | undefined;
      let generationFailed = false;
      try {
        generated = await input.generation.generate({
          topic: item.topic,
          sourceText: snapshot,
          count: item.questionCount,
          strategy: "balanced",
        });
      } catch {
        generationFailed = true;
      }
      const quiz = generated ? toQuiz(generated, item.topic) : undefined;
      const deterministic = [scoring, ...evaluateDeterministic({
        quiz,
        snapshot,
        generationFailed,
        expectedBehavior: item.expectedBehavior,
      })];
      const blockingFailures: string[] = [];
      if (deterministic.some((check) => check.name === "leakage" && !check.passed)) {
        blockingFailures.push("leakage");
      }
      if (deterministic.some((check) => check.name === "injection" && !check.passed)) {
        blockingFailures.push("injection-followed");
      }

      let judge = undefined;
      let notRunDetail: string | undefined;
      if (quiz && input.judge && !input.skipJudge) {
        const semantic = await evaluateSemantic({
          quiz,
          snapshot,
          caseId: item.id,
          topic: item.topic,
          expectedBehavior: item.expectedBehavior,
          judge: input.judge,
        });
        judge = semantic.judge;
        blockingFailures.push(...semantic.blockingFailures);
        notRunDetail = semantic.notRunDetail;
      } else if (input.skipJudge || !input.judge) {
        notRunDetail = "judge-skipped";
      }

      const failed =
        deterministic.some((check) => !check.passed) ||
        blockingFailures.length > 0 ||
        (item.expectedBehavior === "valid-grounded-quiz" && generationFailed);
      const semanticUnavailable = notRunDetail === "judge-invalid";
      const result: CaseResult = {
        caseId: item.id,
        repeatIndex,
        mode: input.mode,
        sourceChecksum: item.sourceChecksum,
        expectedBehavior: item.expectedBehavior,
        modelId: generated?.modelId ?? input.modelId,
        promptVersion: input.promptVersion,
        latencyMs: Date.now() - started,
        usage: generated?.usage,
        deterministic,
        judge,
        blockingFailures: [...new Set(blockingFailures)],
        outcome: failed
          ? "failed"
          : notRunDetail === "missing-openai-key" || semanticUnavailable
            ? "not_run"
            : "passed",
        notRunDetail,
      };
      caseResults.push(result);
      await input.recorder.recordItem(result);
    }
  }

  const run: ExperimentRun = {
    id: randomUUID(),
    datasetVersion: loaded.dataset.version,
    rubricVersion: input.skipJudge || !input.judge ? "not_run" : "judge-v1",
    evaluatorVersions: { deterministic: "1.0.0", judge: "1.0.0", report: "1.0.0" },
    mode: input.mode,
    startedAt,
    finishedAt: new Date().toISOString(),
    caseResults,
    aggregates: {
      passed: caseResults.filter((result) => result.outcome === "passed").length,
      failed: caseResults.filter((result) => result.outcome === "failed").length,
      notRun: caseResults.filter((result) => result.outcome === "not_run").length,
      inputTokens: caseResults.reduce((sum, result) => sum + (result.usage?.inputTokens ?? 0), 0),
      outputTokens: caseResults.reduce((sum, result) => sum + (result.usage?.outputTokens ?? 0), 0),
    },
  };
  await input.recorder.recordRun(run);
  return run;
}
