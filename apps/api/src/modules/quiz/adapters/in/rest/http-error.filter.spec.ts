import { HttpStatus, Logger, NotFoundException } from "@nestjs/common";
import { ApplicationError } from "@ai-quiz/application";
import { HttpErrorFilter } from "./http-error.filter";

function hostWith(json: jest.Mock, status: jest.Mock) {
  status.mockReturnValue({ json });
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
    }),
  } as never;
}

describe("HttpErrorFilter", () => {
  const filter = new HttpErrorFilter();

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "error").mockImplementation();
    jest.spyOn(Logger.prototype, "warn").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs contract 5xx codes without forwarding SDK cause text", () => {
    const json = jest.fn();
    const status = jest.fn();
    filter.catch(
      new ApplicationError("GENERATION_UPSTREAM_FAILED", "model provider quota exceeded"),
      hostWith(json, status),
    );
    expect(Logger.prototype.error).toHaveBeenCalledWith(
      expect.stringContaining("GENERATION_UPSTREAM_FAILED"),
    );
    expect(JSON.stringify((Logger.prototype.error as jest.Mock).mock.calls)).not.toContain("sk-");
  });

  it("maps allowlisted contract codes", () => {
    const json = jest.fn();
    const status = jest.fn();
    filter.catch(new ApplicationError("QUIZ_NOT_FOUND", "Quiz not found"), hostWith(json, status));
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({ code: "QUIZ_NOT_FOUND", message: "Quiz not found" });
  });

  it.each([
    ["SOURCE_UNSAFE_DESTINATION", HttpStatus.BAD_REQUEST],
    ["SOURCE_TOO_LARGE", HttpStatus.PAYLOAD_TOO_LARGE],
    ["SOURCE_UNSUPPORTED_TYPE", HttpStatus.UNSUPPORTED_MEDIA_TYPE],
    ["SOURCE_UNUSABLE", HttpStatus.UNPROCESSABLE_ENTITY],
    ["GENERATION_INVALID", HttpStatus.UNPROCESSABLE_ENTITY],
    ["GENERATION_RETRIES_EXHAUSTED", HttpStatus.UNPROCESSABLE_ENTITY],
    ["SOURCE_FETCH_FAILED", HttpStatus.BAD_GATEWAY],
    ["GENERATION_UPSTREAM_FAILED", HttpStatus.BAD_GATEWAY],
    ["SOURCE_TIMEOUT", HttpStatus.GATEWAY_TIMEOUT],
  ] as const)("maps %s to HTTP %s", (code, httpStatus) => {
    const json = jest.fn();
    const status = jest.fn();
    filter.catch(new ApplicationError(code, "closed"), hostWith(json, status));
    expect(status).toHaveBeenCalledWith(httpStatus);
    expect(json).toHaveBeenCalledWith({ code, message: "closed" });
  });

  it("does not echo Prisma or other provider codes", () => {
    const json = jest.fn();
    const status = jest.fn();
    filter.catch({ code: "P2002", message: "Unique constraint failed" }, hostWith(json, status));
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    });
    expect(JSON.stringify(json.mock.calls[0]?.[0])).not.toContain("P2002");
    expect(JSON.stringify(json.mock.calls[0]?.[0])).not.toContain("Unique constraint");
  });

  it("preserves HttpException status without treating it as a contract code", () => {
    const json = jest.fn();
    const status = jest.fn();
    filter.catch(new NotFoundException(), hostWith(json, status));
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "INTERNAL_ERROR",
      }),
    );
  });
});
