import { Module, type MiddlewareConsumer, type NestModule } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./infrastructure/prisma.module";
import { RequestIdMiddleware } from "./infrastructure/request-id.middleware";
import { RequestLoggingInterceptor } from "./infrastructure/request-logging.interceptor";
import { QuizModule } from "./modules/quiz/quiz.module";

@Module({
  imports: [PrismaModule, HealthModule, QuizModule],
  providers: [{ provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("{*splat}");
  }
}
