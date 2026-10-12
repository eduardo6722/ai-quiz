import { ApplicationError } from "@ai-quiz/application";
import { decodeUtf8, MIN_USABLE_CHARS, normalizeMarkdown, sha256Hex } from "./normalize-markdown";

const USABLE = "Ports are interfaces the core depends on. Adapters implement those ports.\n".repeat(4);

describe("normalizeMarkdown", () => {
  it("rejects NUL bytes as binary", () => {
    expect(() => normalizeMarkdown("hello\u0000world")).toThrow(ApplicationError);
    try {
      normalizeMarkdown("hello\u0000world");
    } catch (error) {
      expect(error).toMatchObject({ code: "SOURCE_UNUSABLE" });
    }
  });

  it("rejects invalid UTF-8", () => {
    expect(() => decodeUtf8(Buffer.from([0xff, 0xfe, 0xfd]))).toThrow(ApplicationError);
  });

  it("strips HTML comments", () => {
    const normalized = normalizeMarkdown(`<!-- ignore this -->\n${USABLE}`);
    expect(normalized.text).toBe(USABLE.trim());
    expect(normalized.text).not.toContain("ignore this");
  });

  it("takes the title from the first ATX heading", () => {
    const normalized = normalizeMarkdown(`# Hexagonal architecture\n\n${USABLE}`);
    expect(normalized.title).toBe("Hexagonal architecture");
  });

  it("produces the same SHA-256 for identical UTF-8 snapshots", () => {
    const first = normalizeMarkdown(USABLE).text;
    const second = normalizeMarkdown(USABLE).text;
    expect(sha256Hex(first)).toBe(sha256Hex(second));
    expect(sha256Hex(first)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("treats empty-after-normalize as below the usable minimum and keeps heading-only text", () => {
    expect(MIN_USABLE_CHARS).toBe(1);
    expect(normalizeMarkdown("   ").text).toHaveLength(0);
    expect(normalizeMarkdown("<!-- chrome -->").text).toHaveLength(0);
    expect(normalizeMarkdown("# Notes").text).toBe("# Notes");
    expect(normalizeMarkdown("# Notes").text.length).toBeGreaterThanOrEqual(MIN_USABLE_CHARS);
  });
});
