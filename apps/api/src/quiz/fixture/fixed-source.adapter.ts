import { createHash } from "node:crypto";
import type { MarkdownSourcePort, SourceSnapshot } from "@ai-quiz/domain";
import { FIXTURE_SNAPSHOT, FIXTURE_TITLE, MAX_SNAPSHOT_BYTES } from "./fixture-bank";

export class FixedSourceAdapter implements MarkdownSourcePort {
  async fetch(url: string): Promise<SourceSnapshot> {
    if (Buffer.byteLength(FIXTURE_SNAPSHOT, "utf8") > MAX_SNAPSHOT_BYTES) {
      throw new Error("fixture snapshot exceeds size limit");
    }
    return {
      originalUrl: url,
      resolvedUrl: url,
      contentSnapshot: FIXTURE_SNAPSHOT,
      contentHash: createHash("sha256").update(FIXTURE_SNAPSHOT, "utf8").digest("hex"),
      title: FIXTURE_TITLE,
      fetchedAt: new Date(),
    };
  }
}
