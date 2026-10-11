import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { corsOptionsForOrigin } from "./infrastructure/cors-options";
import { loadApiEnv } from "./infrastructure/env";

async function bootstrap(): Promise<void> {
  const env = loadApiEnv();
  const logger = new Logger("Bootstrap");
  const generationEnabled = Boolean(env.OPENAI_API_KEY?.trim()) && Boolean(env.OPENAI_MODEL?.trim());
  const tracingEnabled =
    Boolean(env.LANGFUSE_PUBLIC_KEY?.trim()) && Boolean(env.LANGFUSE_SECRET_KEY?.trim());
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.enableCors(corsOptionsForOrigin(env.WEB_ORIGIN));
  await app.listen(env.PORT, "0.0.0.0");
  logger.log(
    `listening on ${env.PORT}; generation ${generationEnabled ? "enabled" : "disabled"} tracing ${tracingEnabled ? "enabled" : "disabled"} model=${env.OPENAI_MODEL?.trim() || "(unset)"}`,
  );
}

void bootstrap();
