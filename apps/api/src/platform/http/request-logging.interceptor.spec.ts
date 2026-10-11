import { Logger } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { RequestLoggingInterceptor } from "./request-logging.interceptor";

describe("RequestLoggingInterceptor", () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation();
    jest.spyOn(Logger.prototype, "warn").mockImplementation();
    jest.spyOn(Logger.prototype, "error").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs successful HTTP method, path, and status as JSON", (done) => {
    new RequestLoggingInterceptor()
      .intercept(
        {
          switchToHttp: () => ({
            getRequest: () => ({ method: "POST", url: "/v1/quizzes" }),
            getResponse: () => ({ statusCode: 201 }),
          }),
        } as never,
        { handle: () => of({ id: "quiz-1" }) },
      )
      .subscribe({
        next: () => {
          const line = (Logger.prototype.log as jest.Mock).mock.calls[0]?.[0] as string;
          const record = JSON.parse(line) as { method: string; path: string; status: number; requestId: string };
          expect(record).toEqual(
            expect.objectContaining({
              method: "POST",
              path: "/v1/quizzes",
              status: 201,
              requestId: "unassigned",
            }),
          );
          done();
        },
        error: done,
      });
  });

  it("logs failed requests with the contract code as JSON", (done) => {
    new RequestLoggingInterceptor()
      .intercept(
        {
          switchToHttp: () => ({
            getRequest: () => ({ method: "POST", url: "/v1/quizzes" }),
            getResponse: () => ({ statusCode: 502 }),
          }),
        } as never,
        {
          handle: () => throwError(() => ({ code: "GENERATION_UPSTREAM_FAILED", message: "quota" })),
        },
      )
      .subscribe({
        error: () => {
          const line = (Logger.prototype.error as jest.Mock).mock.calls[0]?.[0] as string;
          const record = JSON.parse(line) as { code: string; level: string; status: number };
          expect(record).toEqual(
            expect.objectContaining({
              code: "GENERATION_UPSTREAM_FAILED",
              status: 502,
              level: "error",
            }),
          );
          done();
        },
      });
  });
});
