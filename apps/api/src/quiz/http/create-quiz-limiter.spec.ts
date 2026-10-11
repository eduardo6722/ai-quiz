import { CreateQuizLimiter } from "./create-quiz-limiter";

describe("CreateQuizLimiter", () => {
  it("returns rate after 5 timestamps in a 60_000 ms window", () => {
    let now = 1_000;
    const limiter = new CreateQuizLimiter(5, 60_000, 8, () => now);
    for (let i = 0; i < 5; i += 1) {
      expect(limiter.tryAcquire("127.0.0.1")).toBe("ok");
      limiter.release();
    }
    expect(limiter.tryAcquire("127.0.0.1")).toBe("rate");
    now += 60_001;
    expect(limiter.tryAcquire("127.0.0.1")).toBe("ok");
  });

  it("returns concurrency when inFlight is at max 2", () => {
    const limiter = new CreateQuizLimiter(5, 60_000, 2, () => 1_000);
    expect(limiter.tryAcquire("a")).toBe("ok");
    expect(limiter.tryAcquire("b")).toBe("ok");
    expect(limiter.tryAcquire("c")).toBe("concurrency");
    limiter.release();
    expect(limiter.tryAcquire("c")).toBe("ok");
  });

  it("uses unknown for a blank client id and decrements on release", () => {
    const limiter = new CreateQuizLimiter(1, 60_000, 2, () => 1_000);
    expect(limiter.tryAcquire("unknown")).toBe("ok");
    limiter.release();
    limiter.release();
    expect(limiter.tryAcquire("unknown")).toBe("rate");
  });
});
