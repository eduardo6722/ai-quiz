import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { QualityGate } from "./gates.js";
import type { ExperimentRun } from "./types.js";

export type BaselineSnapshot = {
  datasetVersion: string;
  rubricVersion: string;
  experimentId?: string;
  experimentDestinationId?: string;
  gateStates: QualityGate[];
  sourceChecksums: Record<string, string>;
};

export function loadBaseline(evalsRoot: string): BaselineSnapshot | undefined {
  const path = join(evalsRoot, "baselines", "baseline-v1.json");
  if (!existsSync(path)) {
    return undefined;
  }
  return JSON.parse(readFileSync(path, "utf8")) as BaselineSnapshot;
}

export function newFailedGateIds(baseline: BaselineSnapshot, current: QualityGate[]): string[] {
  return current
    .filter((gate) => gate.id !== "regression" && gate.state === "failed")
    .filter((gate) => baseline.gateStates.find((item) => item.id === gate.id)?.state === "passed")
    .map((gate) => gate.id);
}

export function writeBaseline(input: {
  evalsRoot: string;
  run: ExperimentRun;
  gates: QualityGate[];
  checksums: Record<string, string>;
}): void {
  writeFileSync(
    join(input.evalsRoot, "baselines", "baseline-v1.json"),
    `${JSON.stringify(
      {
        datasetVersion: input.run.datasetVersion,
        rubricVersion: input.run.rubricVersion,
        experimentId: input.run.id,
        experimentDestinationId: input.run.experimentDestinationId,
        gateStates: input.gates,
        sourceChecksums: input.checksums,
      },
      null,
      2,
    )}\n`,
  );
}
