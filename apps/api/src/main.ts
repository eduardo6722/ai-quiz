import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { corsOptionsForOrigin } from "./infrastructure/cors-options";
import { loadApiEnv } from "./infrastructure/env";
import { RequestLoggingInterceptor } from "./infrastructure/request-logging.interceptor";

async function bootstrap(): Promise<void> {
  const env = loadApiEnv();
  const logger = new Logger("Bootstrap");
  const generationEnabled = Boolean(env.OPENAI_API_KEY?.trim()) && Boolean(env.OPENAI_MODEL?.trim());
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.enableCors(corsOptionsForOrigin(env.WEB_ORIGIN));
  await app.listen(env.PORT, "0.0.0.0");
  logger.log(
    `listening on ${env.PORT}; generation ${generationEnabled ? "enabled" : "disabled"} model=${env.OPENAI_MODEL?.trim() || "(unset)"}`,
  );
}

void bootstrap();
