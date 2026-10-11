import { Injectable } from "@nestjs/common";

export type LimitResult = "ok" | "rate" | "concurrency";

const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_IN_FLIGHT = 2;

@Injectable()
export class CreateQuizLimiter {
  private readonly windows = new Map<string, number[]>();
  private inFlight = 0;

  constructor(
    private readonly limit = DEFAULT_LIMIT,
    private readonly windowMs = DEFAULT_WINDOW_MS,
    private readonly maxInFlight = DEFAULT_MAX_IN_FLIGHT,
    private readonly now: () => number = Date.now,
  ) {}

  tryAcquire(clientId: string): LimitResult {
    const now = this.now();
    const cut = now - this.windowMs;
    const stamps = (this.windows.get(clientId) ?? []).filter((stamp) => stamp > cut);
    if (stamps.length >= this.limit) {
      this.windows.set(clientId, stamps);
      return "rate";
    }
    stamps.push(now);
    this.windows.set(clientId, stamps);
    if (this.inFlight >= this.maxInFlight) {
      return "concurrency";
    }
    this.inFlight += 1;
    return "ok";
  }

  release(): void {
    if (this.inFlight > 0) {
      this.inFlight -= 1;
    }
  }
}
