import { FixedQuizGenerationAdapter } from "../testing/fixed-generation.js";
import { RecordingExperimentRecorder } from "../testing/recording-experiment-recorder.js";
import { runGolden } from "./run-golden.js";

describe("runGolden", () => {
  it("calls generate with pin text and balanced strategy", async () => {
    const generation = new FixedQuizGenerationAdapter();
    const spy = jest.spyOn(generation, "generate");
    const recorder = new RecordingExperimentRecorder();
    await runGolden({
      generation,
      recorder,
      mode: "mocked",
      skipJudge: true,
      repeat: true,
    });
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0]?.[0].strategy).toBe("balanced");
    expect(spy.mock.calls[0]?.[0].sourceText.length).toBeGreaterThan(0);
    const variability = recorder.items.filter((item) => item.caseId === "express-routing-5");
    expect(variability.map((item) => item.repeatIndex).sort()).toEqual([1, 2]);
  });

  it("counts invalid judge output as not_run, not passed", async () => {
    const recorder = new RecordingExperimentRecorder();
    const run = await runGolden({
      generation: new FixedQuizGenerationAdapter(),
      judge: { evaluate: async () => ({ bad: true }) as never },
      recorder,
      mode: "mocked",
    });
    const invalid = run.caseResults.filter((result) => result.notRunDetail === "judge-invalid");
    expect(invalid.length).toBeGreaterThan(0);
    expect(invalid.every((result) => result.outcome === "not_run")).toBe(true);
    expect(run.aggregates.notRun).toBeGreaterThan(0);
    expect(run.aggregates.passed).toBe(0);
  });
});
