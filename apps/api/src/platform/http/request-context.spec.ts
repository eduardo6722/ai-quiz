import { parseRequestId } from "./request-context";

describe("parseRequestId", () => {
  it("assigns a UUID when the header is absent", () => {
    const parsed = parseRequestId(undefined);
    expect(parsed.source).toBe("assigned");
    expect(parsed.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("reuses a well-formed 8–128 visible ASCII token", () => {
    expect(parseRequestId("demo-trace-0001")).toEqual({ value: "demo-trace-0001", source: "incoming" });
  });

  it("assigns a new id for whitespace, too short, or too long values", () => {
    for (const incoming of ["bad id", "short", "a".repeat(129), "has\nnewline"]) {
      const parsed = parseRequestId(incoming);
      expect(parsed.source).toBe("assigned");
      expect(parsed.value).not.toBe(incoming);
    }
  });
});
