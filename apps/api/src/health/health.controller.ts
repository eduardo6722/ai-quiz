import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from "@nestjs/terminus";
import { PrismaService } from "../platform/persistence/prisma.service";

@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get("health")
  liveness(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("ready")
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.prismaHealth.pingCheck("database", this.prisma)]);
  }
}
