import { Test } from "@nestjs/testing";
import { HealthCheckService, PrismaHealthIndicator } from "@nestjs/terminus";
import request from "supertest";
import { HealthController } from "../../src/health/health.controller";
import { PrismaService } from "../../src/platform/persistence/prisma.service";

describe("GET /health", () => {
  it("returns 200 and status ok without querying PostgreSQL", async () => {
    const prisma = { $queryRaw: jest.fn(), $connect: jest.fn(), $disconnect: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn() },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: { pingCheck: jest.fn() },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();

    await app.close();
  });
});
