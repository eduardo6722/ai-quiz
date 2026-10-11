import { RecordingTelemetryPort } from "./recording-telemetry.js";

describe("RecordingTelemetryPort", () => {
  it("stores outcome ok and durationMs on success", async () => {
    const telemetry = new RecordingTelemetryPort();
    const result = await telemetry.runStage({ name: "fetch" }, async () => "ok");
    expect(result).toBe("ok");
    expect(telemetry.stages).toEqual([
      expect.objectContaining({
        name: "fetch",
        outcome: "ok",
        durationMs: expect.any(Number),
      }),
    ]);
    expect(telemetry.stages[0]?.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("stores outcome error, errorCode, and rethrows", async () => {
    const telemetry = new RecordingTelemetryPort();
    await expect(
      telemetry.runStage({ name: "generation", attributes: { attempt: 1 } }, async () => {
        throw Object.assign(new Error("bad"), { code: "GENERATION_INVALID" });
      }),
    ).rejects.toMatchObject({ code: "GENERATION_INVALID" });
    expect(telemetry.stages).toEqual([
      expect.objectContaining({
        name: "generation",
        outcome: "error",
        errorCode: "GENERATION_INVALID",
        attributes: { attempt: 1 },
      }),
    ]);
  });
});
