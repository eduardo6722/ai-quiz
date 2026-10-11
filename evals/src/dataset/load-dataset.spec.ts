import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { goldenDatasetSchema } from "./schema.js";
import { loadGoldenDataset } from "./load-dataset.js";
import { sha256Bytes } from "./checksum.js";

function validCase(overrides: Record<string, unknown> = {}) {
  return {
    id: "express-routing-5",
    sourceUrl: "https://github.com/expressjs/express/blob/master/Readme.md",
    sourceFile: "sources/a.md",
    sourceChecksum: "sha256:" + "a".repeat(64),
    topic: "Express routing",
    questionCount: 5,
    referenceFacts: [{ id: "f1", claim: "c", evidenceExcerpt: "e" }],
    expectedBehavior: "valid-grounded-quiz",
    tags: ["express", "single"],
    ...overrides,
  };
}

describe("golden dataset schema", () => {
  it("rejects questionCount outside 5–8", () => {
    expect(() =>
      goldenDatasetSchema.parse({
        id: "golden-v1",
        version: "1.0.0",
        cases: Array.from({ length: 12 }, (_, index) =>
          validCase({ id: `case-${index}`, questionCount: index === 0 ? 4 : 5 }),
        ),
      }),
    ).toThrow();
  });

  it("rejects expectedQuestions", () => {
    expect(() =>
      goldenDatasetSchema.parse({
        id: "golden-v1",
        version: "1.0.0",
        cases: Array.from({ length: 12 }, (_, index) =>
          validCase({ id: `case-${index}`, expectedQuestions: ["nope"] }),
        ),
      }),
    ).toThrow();
  });

  it("requires unique kebab-case ids and 12–20 cases", () => {
    const parsed = goldenDatasetSchema.parse({
      id: "golden-v1",
      version: "1.0.0",
      cases: Array.from({ length: 12 }, (_, index) => validCase({ id: `case-${index}` })),
    });
    expect(parsed.cases).toHaveLength(12);
  });
});

describe("loadGoldenDataset", () => {
  it("loads a two-pin fixture and reports checksum mismatch without fetching", () => {
    const root = mkdtempSync(join(tmpdir(), "evals-"));
    mkdirSync(join(root, "sources"));
    mkdirSync(join(root, "datasets"));
    const body = Buffer.from("hello pin");
    writeFileSync(join(root, "sources", "a.md"), body);
    const checksum = sha256Bytes(body);
    writeFileSync(
      join(root, "datasets", "golden-v1.json"),
      JSON.stringify({
        id: "golden-v1",
        version: "1.0.0",
        cases: Array.from({ length: 12 }, (_, index) =>
          validCase({
            id: `case-${index}`,
            sourceChecksum: index === 0 ? checksum : "sha256:" + "b".repeat(64),
          }),
        ),
      }),
    );
    const loaded = loadGoldenDataset({ evalsRoot: root });
    expect(loaded.dataset.cases).toHaveLength(12);
    expect(loaded.errors.some((error) => error.detail === "checksum-mismatch")).toBe(true);
    expect(loaded.pins.get("case-0")).toBe("hello pin");
  });
});
