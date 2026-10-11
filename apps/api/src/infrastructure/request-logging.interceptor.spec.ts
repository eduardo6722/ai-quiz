import { Logger } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { RequestLoggingInterceptor } from "./request-logging.interceptor";

describe("RequestLoggingInterceptor", () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, "log").mockImplementation();
    jest.spyOn(Logger.prototype, "warn").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs successful HTTP method, path, and status", (done) => {
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
          expect(Logger.prototype.log).toHaveBeenCalledWith(expect.stringMatching(/^POST \/v1\/quizzes 201 \d+ms$/));
          done();
        },
        error: done,
      });
  });

  it("logs failed requests with the contract code", (done) => {
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
          expect(Logger.prototype.warn).toHaveBeenCalledWith(
            expect.stringMatching(/^POST \/v1\/quizzes failed GENERATION_UPSTREAM_FAILED \d+ms$/),
          );
          done();
        },
      });
  });
});
