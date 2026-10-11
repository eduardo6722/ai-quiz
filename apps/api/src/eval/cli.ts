import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  applyGates,
  applyHumanOverrides,
  evaluateScoringInvariant,
  findEvalsRoot,
  FixedJudgeAdapter,
  FixedQuizGenerationAdapter,
  loadBaseline,
  loadGoldenDataset,
  loadHumanLabels,
  newFailedGateIds,
  NoOpExperimentRecorder,
  runGolden,
  summarizeCalibration,
  writeBaseline,
  writePhase7Report,
} from "@ai-quiz/evals";
import { OpenAiQuizGenerationAdapter } from "../quiz/generation/openai-quiz-generation.adapter";
import { loadDotenvFiles, parseApiEnv } from "../platform/config/env";
import { OpenAiJudgeAdapter } from "./openai-judge.adapter";
import { LangfuseExperimentAdapter, type LangfuseExperimentClient } from "./langfuse-experiment.adapter";

export type EvalCliFlags = {
  mocked: boolean;
  live: boolean;
  skipJudge: boolean;
  repeat: boolean;
  acceptBaseline: boolean;
};

export function parseEvalArgs(argv: string[]): EvalCliFlags {
  return {
    mocked: argv.includes("--mocked"),
    live: argv.includes("--live"),
    skipJudge: argv.includes("--skip-judge"),
    repeat: argv.includes("--repeat"),
    acceptBaseline: argv.includes("--accept-baseline"),
  };
}

export async function runEvalCli(input: {
  argv: string[];
  env: NodeJS.ProcessEnv;
  langfuseClient?: LangfuseExperimentClient;
  repoRoot?: string;
}): Promise<{ exitCode: number; reportPath: string }> {
  const flags = parseEvalArgs(input.argv);
  const evalsRoot = findEvalsRoot(input.repoRoot ?? process.cwd());
  const repoRoot = input.repoRoot ?? resolve(evalsRoot, "..");
  const env = parseApiEnv({
    DATABASE_URL: input.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/ai_quiz",
    PORT: input.env.PORT,
    NODE_ENV: input.env.NODE_ENV ?? "test",
    OPENAI_API_KEY: input.env.OPENAI_API_KEY,
    OPENAI_MODEL: input.env.OPENAI_MODEL,
    LANGFUSE_PUBLIC_KEY: input.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_SECRET_KEY: input.env.LANGFUSE_SECRET_KEY,
    LANGFUSE_BASE_URL: input.env.LANGFUSE_BASE_URL,
    PROMPT_VERSION: input.env.PROMPT_VERSION,
    EVAL_JUDGE_MODEL: input.env.EVAL_JUDGE_MODEL,
  });
  const hasModel = Boolean(env.OPENAI_API_KEY?.trim() && env.OPENAI_MODEL?.trim());
  const environmentBlockers: string[] = [];

  if (!flags.mocked && !hasModel) {
    environmentBlockers.push("missing-openai-key");
  }

  const generation = flags.mocked || !hasModel
    ? new FixedQuizGenerationAdapter()
    : new OpenAiQuizGenerationAdapter({ apiKey: env.OPENAI_API_KEY, modelId: env.OPENAI_MODEL });
  const judge = flags.skipJudge
    ? undefined
    : flags.mocked || !hasModel
      ? new FixedJudgeAdapter()
      : new OpenAiJudgeAdapter({
          apiKey: env.OPENAI_API_KEY,
          modelId: env.EVAL_JUDGE_MODEL?.trim() || env.OPENAI_MODEL,
        });

  const hasLangfuse = Boolean(env.LANGFUSE_PUBLIC_KEY?.trim() && env.LANGFUSE_SECRET_KEY?.trim());
  let langfuseClient = input.langfuseClient;
  if (!langfuseClient && hasLangfuse) {
    const { LangfuseClient } = await import("@langfuse/client");
    const live = new LangfuseClient({
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      baseUrl: env.LANGFUSE_BASE_URL?.trim() || undefined,
    });
    langfuseClient = {
      experiment: {
        run: async (payload) => {
          const result = await live.experiment.run({
            name: payload.name,
            runName: payload.runName,
            data: payload.data as never,
            metadata: payload.metadata,
            task: payload.task as never,
            evaluators: payload.evaluators as never,
            runEvaluators: payload.runEvaluators as never,
          });
          return { id: result.experimentId, experimentId: result.experimentId };
        },
      },
    };
  }
  const recorder = langfuseClient
    ? new LangfuseExperimentAdapter(langfuseClient)
    : new NoOpExperimentRecorder();
  if (!hasLangfuse) {
    environmentBlockers.push("missing-langfuse-keys");
  }

  const mode = flags.mocked ? "mocked" : "live";
  const run = await runGolden({
    generation,
    judge,
    recorder,
    evalsRoot,
    mode,
    skipJudge: flags.skipJudge,
    repeat: flags.repeat,
    modelId: env.OPENAI_MODEL,
    promptVersion: env.PROMPT_VERSION,
    liveAvailable: mode === "mocked" ? true : hasModel,
  });

  const loaded = loadGoldenDataset({ evalsRoot });
  const labels = loadHumanLabels({ evalsRoot });
  const sourceTagsByCase = new Map(loaded.dataset.cases.map((item) => [item.id, item.tags]));
  const caseResults = applyHumanOverrides(run.caseResults, labels);
  const calibration = summarizeCalibration({ labels, caseResults, sourceTagsByCase });
  const scoringInvariantPassed = evaluateScoringInvariant().passed;
  const preview = applyGates({
    caseResults,
    scoringInvariantPassed,
    calibration,
    baselineExists: false,
  });
  const baseline = loadBaseline(evalsRoot);
  const gates = applyGates({
    caseResults,
    scoringInvariantPassed,
    calibration,
    baselineExists: baseline !== undefined,
    baselineFailedGates: baseline === undefined ? [] : newFailedGateIds(baseline, preview),
  });
  const reportedRun = {
    ...run,
    caseResults,
    aggregates: {
      ...run.aggregates,
      passed: caseResults.filter((result) => result.outcome === "passed").length,
      failed: caseResults.filter((result) => result.outcome === "failed").length,
      notRun: caseResults.filter((result) => result.outcome === "not_run").length,
    },
  };
  await recorder.flush();
  const reportPath = resolve(repoRoot, "docs/evals/phase-7-report.md");
  mkdirSync(dirname(reportPath), { recursive: true });
  writePhase7Report({
    repoRoot,
    run: reportedRun,
    gates,
    calibration,
    checksums: loaded.dataset.cases.map((item) => ({
      caseId: item.id,
      sourceUrl: item.sourceUrl,
      checksum: item.sourceChecksum,
      topic: item.topic,
      count: item.questionCount,
      expectedBehavior: item.expectedBehavior,
    })),
    environmentBlockers,
    targetedFixes: "none",
  });
  if (flags.acceptBaseline) {
    writeBaseline({
      evalsRoot,
      run: reportedRun,
      gates,
      checksums: Object.fromEntries(loaded.dataset.cases.map((item) => [item.id, item.sourceChecksum])),
    });
  }
  if (!flags.mocked && !hasModel) {
    return { exitCode: 1, reportPath };
  }
  return { exitCode: 0, reportPath };
}

async function main(): Promise<void> {
  loadDotenvFiles();
  const result = await runEvalCli({ argv: process.argv.slice(2), env: process.env });
  process.exitCode = result.exitCode;
}

if (process.argv[1]?.includes("cli.ts") || process.argv[1]?.includes("cli.js")) {
  void main();
}
