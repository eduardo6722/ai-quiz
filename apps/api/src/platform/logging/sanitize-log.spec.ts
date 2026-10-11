import { sanitizeLogText } from "./sanitize-log";

describe("sanitizeLogText", () => {
  it("redacts API keys and bearer tokens without keeping secret suffixes", () => {
    const line = sanitizeLogText("upstream sk-live-secret-value-abcdef Authorization Bearer abc.def");
    expect(line).toContain("[redacted]");
    expect(line).not.toContain("sk-live-secret");
    expect(line).not.toContain("abc.def");
  });

  it("collapses whitespace and truncates long lines", () => {
    const line = sanitizeLogText(`quota\n${"x".repeat(400)}`);
    expect(line).not.toContain("\n");
    expect(line.endsWith("…")).toBe(true);
    expect(line.length).toBeLessThanOrEqual(281);
  });
});
