import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { QuizGenerationPort } from "@ai-quiz/domain";
import { AppModule } from "../../src/app.module";
import { FixedGenerationAdapter } from "../../src/modules/quiz/adapters/out/fixture/fixed-generation.adapter";
import { FixedSourceAdapter } from "../../src/modules/quiz/adapters/out/fixture/fixed-source.adapter";
import type { FetchTransport } from "../../src/modules/quiz/adapters/out/source-fetch/fetch-transport";
import {
  FETCH_TRANSPORT,
  MARKDOWN_SOURCE_PORT,
  QUIZ_GENERATION_PORT,
} from "../../src/modules/quiz/quiz.tokens";

export type CreateApiAppOptions = {
  contentPorts?: "fixture" | "product";
  fetchTransport?: FetchTransport;
  generation?: QuizGenerationPort;
};

export async function createApiApp(options: CreateApiAppOptions = {}): Promise<INestApplication> {
  let builder = Test.createTestingModule({
    imports: [AppModule],
  });

  if (options.fetchTransport !== undefined) {
    builder = builder.overrideProvider(FETCH_TRANSPORT).useValue(options.fetchTransport);
    if (options.generation !== undefined) {
      builder = builder.overrideProvider(QUIZ_GENERATION_PORT).useValue(options.generation);
    } else {
      builder = builder.overrideProvider(QUIZ_GENERATION_PORT).useClass(FixedGenerationAdapter);
    }
  } else if (options.generation !== undefined) {
    builder = builder
      .overrideProvider(MARKDOWN_SOURCE_PORT)
      .useClass(FixedSourceAdapter)
      .overrideProvider(QUIZ_GENERATION_PORT)
      .useValue(options.generation);
  } else if (options.contentPorts === "product") {
    // Use QuizModule product adapters (live README / real fetch).
  } else {
    builder = builder
      .overrideProvider(MARKDOWN_SOURCE_PORT)
      .useClass(FixedSourceAdapter)
      .overrideProvider(QUIZ_GENERATION_PORT)
      .useClass(FixedGenerationAdapter);
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

export const CREATE_BODY = {
  topic: "Hexagonal architecture",
  sourceUrl: "https://example.com/README.md",
  questionCount: 5,
};

export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
