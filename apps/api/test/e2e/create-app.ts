import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";

export async function createApiApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
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
