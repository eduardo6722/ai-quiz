import { Injectable, Logger, type CallHandler, type ExecutionContext, type NestInterceptor } from "@nestjs/common";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { sanitizeLogText } from "./sanitize-log";

type HttpRequestLike = { method?: string; url?: string };
type HttpResponseLike = { statusCode?: number };

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<HttpRequestLike>();
    const response = http.getResponse<HttpResponseLike>();
    const method = request.method ?? "UNKNOWN";
    const url = sanitizeLogText(request.url ?? "/", 120);
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`${method} ${url} ${response.statusCode ?? 200} ${Date.now() - started}ms`);
        },
        error: (error: unknown) => {
          const code =
            typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
              ? error.code
              : error instanceof Error
                ? error.name
                : "ERROR";
          this.logger.warn(`${method} ${url} failed ${sanitizeLogText(code)} ${Date.now() - started}ms`);
        },
      }),
    );
  }
}
