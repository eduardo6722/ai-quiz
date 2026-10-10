import { ServiceUnavailableException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { HealthCheckService, PrismaHealthIndicator } from "@nestjs/terminus";
import request from "supertest";
import { HealthController } from "../src/health/health.controller";
import { PrismaService } from "../src/infrastructure/prisma.service";

describe("GET /ready", () => {
  it("returns 503 when the database ping fails", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(async () => {
              throw new ServiceUnavailableException({
                status: "error",
                details: { database: "down" },
              });
            }),
          },
        },
        {
          provide: PrismaHealthIndicator,
          useValue: { pingCheck: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: { $queryRaw: jest.fn(), $connect: jest.fn(), $disconnect: jest.fn() },
        },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer()).get("/ready");

    expect(response.status).toBe(503);

    await app.close();
  });
});
