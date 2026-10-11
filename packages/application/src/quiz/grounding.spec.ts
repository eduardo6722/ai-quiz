import { ApplicationError } from "../errors.js";
import { assertGrounded, locateSourceExcerpt } from "./grounding.js";
import { SAMPLE_EXCERPT, SAMPLE_SNAPSHOT, sampleQuiz } from "../testing/quiz-fixture.js";

const TYPESCRIPT_SNAPSHOT = `# TypeScript

[TypeScript](https://www.typescriptlang.org/) is a language for application-scale JavaScript. TypeScript adds optional types to JavaScript that support tools for large-scale JavaScript applications for any browser, for any host, on any OS. TypeScript compiles to readable, standards-based JavaScript.

## Installing

\`\`\`bash
npm install -D typescript
\`\`\`
`;

describe("locateSourceExcerpt", () => {
  it("returns an exact contiguous substring", () => {
    expect(locateSourceExcerpt(SAMPLE_SNAPSHOT, SAMPLE_EXCERPT)).toBe(SAMPLE_EXCERPT);
  });

  it("maps a link-stripped TypeScript sentence back onto the snapshot span", () => {
    const located = locateSourceExcerpt(
      TYPESCRIPT_SNAPSHOT,
      "TypeScript is a language for application-scale JavaScript",
    );
    expect(located).toBe(
      "[TypeScript](https://www.typescriptlang.org/) is a language for application-scale JavaScript",
    );
    expect(TYPESCRIPT_SNAPSHOT.includes(located!)).toBe(true);
  });

  it("accepts excerpts with collapsed whitespace", () => {
    expect(locateSourceExcerpt(SAMPLE_SNAPSHOT, "Ports   are\ninterfaces the core depends on")).toBe(
      SAMPLE_EXCERPT,
    );
  });

  it("strips wrapping quotes before matching", () => {
    expect(locateSourceExcerpt(SAMPLE_SNAPSHOT, `"${SAMPLE_EXCERPT}"`)).toBe(SAMPLE_EXCERPT);
  });

  it("returns undefined for invented text", () => {
    expect(locateSourceExcerpt(TYPESCRIPT_SNAPSHOT, "TypeScript is a superset invented here")).toBeUndefined();
  });
});

describe("assertGrounded", () => {
  it("accepts excerpts that appear in the snapshot", () => {
    expect(() => assertGrounded(sampleQuiz().questions, SAMPLE_SNAPSHOT)).not.toThrow();
  });

  it("rewrites link-stripped excerpts to the snapshot substring", () => {
    const questions = sampleQuiz().questions.map((question, index) => ({
      ...question,
      sourceExcerpt:
        index === 0
          ? "TypeScript is a language for application-scale JavaScript"
          : "TypeScript adds optional types to JavaScript",
    }));
    expect(() => assertGrounded(questions, TYPESCRIPT_SNAPSHOT)).not.toThrow();
    expect(questions[0]?.sourceExcerpt).toBe(
      "[TypeScript](https://www.typescriptlang.org/) is a language for application-scale JavaScript",
    );
    expect(TYPESCRIPT_SNAPSHOT.includes(questions[1]!.sourceExcerpt!)).toBe(true);
  });

  it("rejects missing excerpts", () => {
    const questions = sampleQuiz().questions.map((question) => ({
      ...question,
      sourceExcerpt: undefined,
    }));
    expect(() => assertGrounded(questions, SAMPLE_SNAPSHOT)).toThrow(ApplicationError);
  });

  it("rejects excerpts that are not substrings", () => {
    const questions = sampleQuiz().questions.map((question) => ({
      ...question,
      sourceExcerpt: `${SAMPLE_EXCERPT} missing`,
    }));
    expect(() => assertGrounded(questions, SAMPLE_SNAPSHOT)).toThrow(ApplicationError);
  });
});
