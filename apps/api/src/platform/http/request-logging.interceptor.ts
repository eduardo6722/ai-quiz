import { Injectable, Logger, type CallHandler, type ExecutionContext, type NestInterceptor } from "@nestjs/common";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { ErrorCodes } from "@ai-quiz/contracts";
import { getRequestId } from "./request-context";
import { redactSensitive } from "../logging/redact-sensitive";

type HttpRequestLike = { method?: string; url?: string };
type HttpResponseLike = { statusCode?: number };

const STATUS_BY_CODE: Record<string, number> = {
  [ErrorCodes.REQUEST_RATE_LIMITED]: 429,
  [ErrorCodes.GENERATION_CONCURRENCY_LIMIT]: 503,
  [ErrorCodes.CREATE_QUIZ_INVALID]: 400,
  [ErrorCodes.SOURCE_UNSAFE_DESTINATION]: 400,
  [ErrorCodes.SOURCE_TOO_LARGE]: 413,
  [ErrorCodes.SOURCE_UNSUPPORTED_TYPE]: 415,
  [ErrorCodes.SOURCE_UNUSABLE]: 422,
  [ErrorCodes.GENERATION_INVALID]: 422,
  [ErrorCodes.GENERATION_RETRIES_EXHAUSTED]: 422,
  [ErrorCodes.SOURCE_FETCH_FAILED]: 502,
  [ErrorCodes.GENERATION_UPSTREAM_FAILED]: 502,
  [ErrorCodes.SOURCE_TIMEOUT]: 504,
};

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<HttpRequestLike>();
    const response = http.getResponse<HttpResponseLike>();
    const method = request.method ?? "UNKNOWN";
    const path = redactSensitive((request.url ?? "/").split("?")[0] ?? "/", 120);
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.write({
            level: "info",
            method,
            path,
            status: response.statusCode ?? 200,
            durationMs: Date.now() - started,
          });
        },
        error: (error: unknown) => {
          const code =
            typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
              ? error.code
              : undefined;
          const status = (code !== undefined ? STATUS_BY_CODE[code] : undefined) ?? response.statusCode ?? 500;
          const level = status >= 500 ? "error" : "warn";
          this.write({
            level,
            method,
            path,
            status,
            durationMs: Date.now() - started,
            code,
          });
        },
      }),
    );
  }

  private write(fields: {
    level: "info" | "warn" | "error";
    method: string;
    path: string;
    status: number;
    durationMs: number;
    code?: string;
  }): void {
    const record = {
      timestamp: new Date().toISOString(),
      level: fields.level,
      requestId: getRequestId() ?? "unassigned",
      method: fields.method,
      path: fields.path,
      status: fields.status,
      durationMs: fields.durationMs,
      ...(fields.code !== undefined ? { code: redactSensitive(fields.code) } : {}),
    };
    const line = JSON.stringify(record);
    if (fields.level === "error") {
      this.logger.error(line);
    } else if (fields.level === "warn") {
      this.logger.warn(line);
    } else {
      this.logger.log(line);
    }
  }
}
