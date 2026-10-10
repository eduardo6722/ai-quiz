import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadApiEnv } from "./infrastructure/env";

async function bootstrap(): Promise<void> {
  const env = loadApiEnv();
  const app = await NestFactory.create(AppModule);
  await app.listen(env.PORT, "0.0.0.0");
}

void bootstrap();
