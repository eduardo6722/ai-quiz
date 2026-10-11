import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sha256Bytes, sha256File } from "./checksum.js";

describe("sha256File", () => {
  it("matches the hash of the exact file bytes", () => {
    const dir = mkdtempSync(join(tmpdir(), "pin-"));
    const path = join(dir, "pin.md");
    const bytes = Buffer.from("abc");
    writeFileSync(path, bytes);
    expect(sha256File(path)).toBe(sha256Bytes(bytes));
  });

  it("changes when the pin bytes change", () => {
    const dir = mkdtempSync(join(tmpdir(), "pin-"));
    const path = join(dir, "pin.md");
    writeFileSync(path, "abc");
    const original = sha256File(path);
    writeFileSync(path, "abd");
    expect(sha256File(path)).not.toBe(original);
  });
});
