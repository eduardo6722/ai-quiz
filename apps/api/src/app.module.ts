import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./infrastructure/prisma.module";
import { QuizModule } from "./modules/quiz/quiz.module";

@Module({
  imports: [PrismaModule, HealthModule, QuizModule],
})
export class AppModule {}
