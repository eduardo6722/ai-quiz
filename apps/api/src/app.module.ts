import { Module, type MiddlewareConsumer, type NestModule } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { HealthModule } from "./health/health.module";
import { HttpErrorFilter } from "./platform/http/http-error.filter";
import { RequestIdMiddleware } from "./platform/http/request-id.middleware";
import { RequestLoggingInterceptor } from "./platform/http/request-logging.interceptor";
import { PrismaModule } from "./platform/persistence/prisma.module";
import { QuizModule } from "./quiz/quiz.module";

@Module({
  imports: [PrismaModule, HealthModule, QuizModule],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_FILTER, useClass: HttpErrorFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes("{*splat}");
  }
}
