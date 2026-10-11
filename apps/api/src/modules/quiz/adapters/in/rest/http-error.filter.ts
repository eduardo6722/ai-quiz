import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Response } from "express";
import { ErrorCodes, type ErrorCode } from "@ai-quiz/contracts";
import { sanitizeLogText } from "../../../../../infrastructure/sanitize-log";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  [ErrorCodes.CREATE_QUIZ_INVALID]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.SUBMIT_ANSWERS_INVALID]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.SELECTION_ILLEGAL]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.ATTEMPT_INCOMPLETE]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.SOURCE_UNSAFE_DESTINATION]: HttpStatus.BAD_REQUEST,
  [ErrorCodes.UNAUTHORIZED_ATTEMPT]: HttpStatus.UNAUTHORIZED,
  [ErrorCodes.QUIZ_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.ATTEMPT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCodes.ATTEMPT_NOT_SCORED]: HttpStatus.CONFLICT,
  [ErrorCodes.QUIZ_NOT_PLAYABLE]: HttpStatus.CONFLICT,
  [ErrorCodes.SOURCE_TOO_LARGE]: HttpStatus.PAYLOAD_TOO_LARGE,
  [ErrorCodes.SOURCE_UNSUPPORTED_TYPE]: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
  [ErrorCodes.QUIZ_INVALID]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ErrorCodes.SOURCE_UNUSABLE]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ErrorCodes.GENERATION_INVALID]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ErrorCodes.GENERATION_RETRIES_EXHAUSTED]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ErrorCodes.SOURCE_FETCH_FAILED]: HttpStatus.BAD_GATEWAY,
  [ErrorCodes.GENERATION_UPSTREAM_FAILED]: HttpStatus.BAD_GATEWAY,
  [ErrorCodes.SOURCE_TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,
};

const ALLOWED_CODES = new Set<string>(Object.values(ErrorCodes));

type CodedError = { code?: string; message?: string };

function allowlistedCode(value: unknown): ErrorCode | undefined {
  if (typeof value !== "string" || !ALLOWED_CODES.has(value)) {
    return undefined;
  }
  return value as ErrorCode;
}

function httpExceptionMessage(exception: HttpException, status: number): string {
  if (status >= 500) {
    return "Internal server error";
  }
  const payload = exception.getResponse();
  if (typeof payload === "string" && payload.length > 0) {
    return payload;
  }
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return exception.message.length > 0 ? exception.message : "Request failed";
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const coded = exception as CodedError;
    const contractCode = allowlistedCode(coded.code);

    if (contractCode !== undefined) {
      const status = STATUS_BY_CODE[contractCode];
      const line = sanitizeLogText(`${contractCode} ${coded.message ?? "Request failed"}`);
      if (status >= 500) {
        this.logger.error(line);
      } else {
        this.logger.warn(line);
      }
      response.status(status).json({
        code: contractCode,
        message: coded.message ?? "Request failed",
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = {
        code: "INTERNAL_ERROR" as const,
        message: httpExceptionMessage(exception, status),
      };
      if (status >= 500) {
        this.logger.error(sanitizeLogText(`Unhandled HttpException ${status}`));
      }
      response.status(status).json(body);
      return;
    }

    const detail = exception instanceof Error ? `${exception.name}: ${exception.message}` : "unknown";
    this.logger.error(sanitizeLogText(`Unhandled error ${detail}`));
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }
}
